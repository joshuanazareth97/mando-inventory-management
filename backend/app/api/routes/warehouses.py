from app.tests.utils.http_exceptions import raise404, raiseForbidden
from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select, func, join
from typing import Any
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Item,
    Store,
    StoreItem,
    Warehouse,
    WarehouseItem,
    WarehousePublic,
    WarehousesPublic,
)

router = APIRouter()


@router.get("/items/units", response_model=None)
def get_units_per_warehouse_item(session: SessionDep):
    warehouses = session.exec(select(Warehouse)).all()
    if not warehouses:
        return []
    result = []
    for warehouse in warehouses:
        warehouse_items_statement = (
            select(
                Item,
                func.sum(WarehouseItem.quantity).label("total_units"),
                func.sum(WarehouseItem.quantity * Item.wholesale_price).label(
                    "total_wholesale_value"
                ),
                func.sum(WarehouseItem.quantity * Item.retail_price).label(
                    "total_retail_value"
                ),
            )
            .select_from(join(WarehouseItem, Item, WarehouseItem.item_id == Item.id))
            .where(WarehouseItem.warehouse_id == warehouse.id)
            .group_by(Item.id)
        )
        items = session.exec(warehouse_items_statement).all()
        result.append(
            {
                "name": warehouse.name,
                "warehouse_id": warehouse.id,
                "items": [dict(row._asdict()) for row in items],
            }
        )
    return result


@router.get("/", response_model=WarehousesPublic)
def read_warehouses(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Warehouse)
        count = session.exec(count_statement).one()
        statement = select(Warehouse).offset(skip).limit(limit)
        warehouses = session.exec(statement).all()
        return WarehousesPublic(data=list(warehouses), count=count)
    else:
        raise raiseForbidden("warehouse")


@router.get("/{id}", response_model=WarehousePublic)
def read_warehouse(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    warehouse = session.get(Warehouse, id)
    if not current_user.is_superuser:
        raise raiseForbidden("warehouse")
    if not warehouse:
        raise raise404("warehouse")
    return warehouse


@router.post("/", response_model=Warehouse)
def create_warehouse(
    session: SessionDep, warehouse: Warehouse, current_user: CurrentUser
) -> Any:
    if not current_user.is_superuser:
        raise raiseForbidden("warehouse")
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    return warehouse


@router.put("/{id}", response_model=Warehouse)
def update_warehouse(
    session: SessionDep, id: int, warehouse: Warehouse, current_user: CurrentUser
) -> Any:
    if not current_user.is_superuser:
        raise raiseForbidden("warehouse")
    db_warehouse = session.get(Warehouse, id)
    if not db_warehouse:
        raise raise404("warehouse")
    warehouse_data = warehouse.model_dump(exclude_unset=True)
    for key, value in warehouse_data.items():
        setattr(db_warehouse, key, value)
    session.add(db_warehouse)
    session.commit()
    session.refresh(db_warehouse)
    return db_warehouse


@router.delete("/{id}")
def delete_warehouse(session: SessionDep, id: int) -> Any:
    warehouse = session.get(Warehouse, id)
    if not warehouse:
        raise raise404("warehouse")
    session.delete(warehouse)
    session.commit()
    return {"message": "Warehouse deleted successfully"}


@router.post("/{id}/items/{item_id}", response_model=Warehouse)
def receive_item(session: SessionDep, id: int, item_id: int, quantity: int) -> Any:
    warehouse = session.get(Warehouse, id)
    if not warehouse:
        raise raise404("warehouse")
    try:
        warehouse_item_id = next(
            filter(lambda item: item.item_id == item_id, warehouse.item_links)
        )
    except StopIteration:
        warehouse_item_id = None
    if not warehouse_item_id:
        warehouse_item = WarehouseItem(
            warehouse_id=id, item_id=item_id, quantity=quantity
        )
        warehouse.item_links.append(warehouse_item)
    else:
        warehouse_item = session.get(WarehouseItem, (id, item_id))
        if warehouse_item:
            warehouse_item.quantity += quantity
    session.add(warehouse)
    session.add(warehouse_item)
    session.commit()
    session.refresh(warehouse)
    return warehouse


@router.post("/{id}/items/{item_id}/stores/{store_id}")
def ship_item_to_store(
    session: SessionDep, id: int, item_id: int, store_id: int, quantity: int
) -> Any:
    warehouse = session.get(Warehouse, id)
    if not warehouse:
        raise raise404("warehouse")
    try:
        warehouse_item = next(
            filter(lambda item: item.item_id == item_id, warehouse.item_links)
        )
    except StopIteration:
        warehouse_item = None
    if not warehouse_item:
        raise raise404("warehouse item")
    store = session.get(Store, store_id)
    if not store:
        raise raise404("store")
    if warehouse_item.quantity < quantity:
        raise HTTPException(status_code=400, detail="Not enough items in warehouse")
    try:
        store_item = next(
            filter(lambda item: item.item_id == item_id, store.item_links)
        )
    except StopIteration:
        new_store_item = StoreItem(
            store_id=store_id, item_id=item_id, quantity=quantity
        )
        store.item_links.append(new_store_item)
    else:
        store_item.quantity += quantity
    warehouse_item.quantity -= quantity
    session.add(store)
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    session.refresh(store)
    return warehouse
