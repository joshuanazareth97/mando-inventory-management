from logging import Logger
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select, union_all, join

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Item,
    ItemCreate,
    ItemPublic,
    ItemsPublic,
    ItemUpdate,
    Message,
    StoreItem,
    WarehouseItem,
)

router = APIRouter()


@router.get("/units", response_model=None)
def get_units_per_item(session: SessionDep):
    """
    Get the total number of units per item.
    """
    store_items_statement = (
        select(
            StoreItem.item_id,
            Item.title,
            func.sum(StoreItem.quantity).label("total_units"),
        )
        .select_from(join(StoreItem, Item, StoreItem.item_id == Item.id))
        .group_by(StoreItem.item_id, Item.title)
    )

    # Query to get total units per item in warehouses
    # Replace WarehouseItem with the actual model name
    warehouse_items_statement = (
        select(
            WarehouseItem.item_id,
            Item.title,
            func.sum(WarehouseItem.quantity).label("total_units"),
        )
        .select_from(join(WarehouseItem, Item, WarehouseItem.item_id == Item.id))
        .group_by(WarehouseItem.item_id, Item.title)
    )

    # # Combine the two queries using UNION ALL
    combined_statement = union_all(
        store_items_statement, warehouse_items_statement
    ).alias()

    # Sum the quantities from the combined result
    final_statement = select(
        combined_statement.c.item_id,
        combined_statement.c.title,
        func.sum(combined_statement.c.total_units).label("total_units"),
    ).group_by(combined_statement.c.item_id, combined_statement.c.title)

    # # Execute the final statement
    items = session.exec(final_statement).all()

    return [dict(row._asdict()) for row in items]


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """
    Logger("test").info("Getting total units per item")

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Item)
        count = session.exec(count_statement).one()
        statement = select(Item).offset(skip).limit(limit)
        items = session.exec(statement).all()
    else:
        count_statement = select(func.count()).select_from(Item)
        count = session.exec(count_statement).one()
        statement = select(Item).offset(skip).limit(limit)
        items = session.exec(statement).all()

    return ItemsPublic(data=list(items), count=count)


@router.get("/{id}", response_model=Item)
def read_item(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return item


@router.post("/", response_model=Item)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item.
    """
    item = Item.model_validate(item_in, update={"owner_id": current_user.id})
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{id}", response_model=Item)
def update_item(
    *, session: SessionDep, current_user: CurrentUser, id: int, item_in: ItemUpdate
) -> Any:
    """
    Update an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_item(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
    """
    Delete an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
