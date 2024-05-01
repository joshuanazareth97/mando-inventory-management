from app.tests.utils.http_exceptions import raiseForbidden
from fastapi import APIRouter, HTTPException
from sqlmodel import Session, SQLModel, select, func, join
from typing import Any
from app.api.deps import CurrentUser, SessionDep
from app.models import Item, Purchase, Store, StoreItem, StoresPublic

router = APIRouter()


@router.get("/items/units", response_model=None)
def get_units_per_store_item(session: SessionDep):
    stores = session.exec(select(Store)).all()
    if not stores:
        return []
    result = []
    for store in stores:
        store_items_statement = (
            select(
                Item,
                func.sum(StoreItem.quantity).label("total_units"),
                func.sum(StoreItem.quantity * Item.wholesale_price).label(
                    "total_wholesale_value"
                ),
                func.sum(StoreItem.quantity * Item.retail_price).label(
                    "total_retail_value"
                ),
            )
            .select_from(join(StoreItem, Item, StoreItem.item_id == Item.id))
            .where(StoreItem.store_id == store.id)
            .group_by(Item.id)
        )
        items = session.exec(store_items_statement).all()
        result.append(
            {
                "name": store.name,
                "store_id": store.id,
                "items": [row._asdict() for row in items],
            }
        )
    return result


@router.get("/revenue")
def get_store_revenue(session: SessionDep):
    stores = session.exec(select(Store)).all()
    if not stores:
        return []
    result = []
    for store in stores:
        store_purchases_statement = (
            select(
                func.sum(Purchase.quantity * Item.retail_price).label("revenue"),
                func.sum(Purchase.quantity * Item.wholesale_price).label("cost"),
            )
            .select_from(join(Purchase, Item, Purchase.item_id == Item.id))
            .where(Purchase.store_id == store.id)
        )
        revenue = session.exec(store_purchases_statement).first()
        if revenue:
            row_dict = {}
            row_dict["store"] = store.name
            row_dict["store_id"] = store.id
            row_dict["total_revenue"] = revenue._asdict().get("revenue") or 0.0
            row_dict["total_cost"] = revenue._asdict().get("cost") or 0.0
            row_dict["total_profit"] = (
                row_dict["total_revenue"] - row_dict["total_cost"]
            )
            result.append(row_dict)
    return result


@router.get("/")
def read_stores(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Store)
        count = session.exec(count_statement).one()
        statement = select(Store).offset(skip).limit(limit)
        stores = session.exec(statement).all()
        return StoresPublic(data=list(stores), count=count)
    else:
        raise raiseForbidden("warehouse")


@router.get("/{id}")
def read_store(session: SessionDep, id: int) -> Any:
    store = session.get(Store, id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("/")
def create_store(session: SessionDep, store: Store) -> Any:
    session.add(store)
    session.commit()
    session.refresh(store)
    return store


@router.put("/{id}")
def update_store(session: SessionDep, id: int, store: Store) -> Any:
    db_store = session.get(Store, id)
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")
    store_data = store.model_dump(exclude_unset=True)
    for key, value in store_data.items():
        setattr(db_store, key, value)
    session.add(db_store)
    session.commit()
    session.refresh(db_store)
    return db_store


@router.delete("/{id}")
def delete_store(session: SessionDep, id: int) -> Any:
    store = session.get(Store, id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    session.delete(store)
    session.commit()
    return {"message": "Store deleted successfully"}


@router.post("/{id}/items/{item_id}/purchase")
def purchase_item(session: SessionDep, id: int, item_id: int, quantity: int) -> Any:
    store = session.get(Store, id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    store_item = session.exec(
        select(StoreItem).where(StoreItem.store_id == id, StoreItem.item_id == item_id)
    ).first()
    if not store_item:
        raise HTTPException(status_code=404, detail="Item not found in store")
    if store_item.quantity < quantity:
        raise HTTPException(status_code=400, detail="Not enough items in stock")
    store_item.quantity -= quantity
    purchase = Purchase(store_id=id, item_id=item_id, quantity=quantity)
    session.add(store_item)
    session.add(purchase)
    session.commit()
    return store_item
