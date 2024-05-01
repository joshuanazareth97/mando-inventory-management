import datetime
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
# TODO replace email str with EmailStr when sqlmodel supports it
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# TODO replace email str with EmailStr when sqlmodel supports it
class UserRegister(SQLModel):
    email: str
    password: str
    full_name: str | None = None


# Properties to receive via API on update, all are optional
# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdate(UserBase):
    email: str | None = None  # type: ignore
    password: str | None = None


# TODO replace email str with EmailStr when sqlmodel supports it
class UserUpdateMe(SQLModel):
    full_name: str | None = None
    email: str | None = None


class UpdatePassword(SQLModel):
    current_password: str
    new_password: str


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: int


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: int | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str


# Inventory Management

"""
Item - SKU containing wholesale and retail prices
Warehouse - location holding excess items
Store - stocks items from warehouses
employee - user that is assigned to a store. read only access
admin - superuser that can create, update, delete items, warehouses, and stores
purchase - records a customer buying x units of y items from a store
"""


# Link Models
class WarehouseItem(SQLModel, table=True):
    warehouse_id: int | None = Field(
        default=None, foreign_key="warehouse.id", primary_key=True
    )
    item_id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    quantity: int = Field(default=0)
    warehouse: "Warehouse" = Relationship(back_populates="item_links")
    item: "Item" = Relationship(back_populates="warehouse_links")


class StoreItem(SQLModel, table=True):
    store_id: int | None = Field(default=None, foreign_key="store.id", primary_key=True)
    item_id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    quantity: int = Field(default=0)

    store: "Store" = Relationship(back_populates="item_links")
    item: "Item" = Relationship(back_populates="store_links")


# ** ITEMS **
class ItemBase(SQLModel):
    title: str


# Properties to receive on item creation
class ItemCreate(ItemBase):
    title: str
    retail_price: float
    wholesale_price: float


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    wholesale_price: float = Field(default=0.0)
    retail_price: float = Field(default=0.0)
    warehouse_links: list["WarehouseItem"] = Relationship(back_populates="item")
    store_links: list["StoreItem"] = Relationship(back_populates="item")
    purchases: list["Purchase"] = Relationship(back_populates="item")


class ItemPublic(ItemBase):
    id: int


class ItemsPublic(SQLModel):
    data: list[Item]
    count: int


# ** WAREHOUSES **
class WarehouseBase(SQLModel):
    name: str


class Warehouse(WarehouseBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    item_links: list["WarehouseItem"] = Relationship(back_populates="warehouse")


class WarehousePublic(WarehouseBase):
    id: int
    name: str
    # items: list[ItemPublic]


class WarehousesPublic(SQLModel):
    data: list[Warehouse]
    count: int


# ** STORES **
class StoreBase(SQLModel):
    name: str


class Store(StoreBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    item_links: list["StoreItem"] = Relationship(back_populates="store")
    purchases: list["Purchase"] = Relationship(back_populates="store")


class StorePublic(StoreBase):
    id: int
    name: str
    # items: list[ItemPublic]


class StoresPublic(SQLModel):
    data: list[Store]
    count: int


# ** PURCHASES **
class Purchase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    store_id: int = Field(default=None, foreign_key="store.id")
    store: Store = Relationship(back_populates="purchases")
    item_id: int = Field(default=None, foreign_key="item.id")
    item: Item = Relationship(back_populates="purchases")
    quantity: int
    # created_at: datetime = Field(default=datetime)
    # updated_at: datetime = Field(default=datetime.now())


class PurchasePublic(SQLModel):
    id: int
    store_id: int
    item_id: int
    quantity: int
    # created_at: datetime
    # updated_at: datetime


class PurchasesPublic(SQLModel):
    data: list[PurchasePublic]
    count: int
