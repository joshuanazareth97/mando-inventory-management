export type ListResponse<T> = {
  data: Array<T>;
  count: number;
};

export type Body_login_login_access_token = {
  grant_type?: string | null;
  username: string;
  password: string;
  scope?: string;
  client_id?: string | null;
  client_secret?: string | null;
};

export type HTTPValidationError = {
  detail?: Array<ValidationError>;
};

export type ItemCreate = {
  title: string;
  description?: string | null;
};

export type ItemPublic = {
  title: string;
  description?: string | null;
  id: number;
  owner_id: number;
};

export type ItemUpdate = {
  title?: string | null;
  description?: string | null;
};

export type ItemsPublic = {
  data: Array<ItemPublic>;
  count: number;
};

export type Message = {
  message: string;
};

export type NewPassword = {
  token: string;
  new_password: string;
};

export type Token = {
  access_token: string;
  token_type?: string;
};

export type UpdatePassword = {
  current_password: string;
  new_password: string;
};

export type UserCreate = {
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string | null;
  password: string;
};

export type UserPublic = {
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string | null;
  id: number;
};

export type UserRegister = {
  email: string;
  password: string;
  full_name?: string | null;
};

export type UserUpdate = {
  email?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string | null;
  password?: string | null;
};

export type UserUpdateMe = {
  full_name?: string | null;
  email?: string | null;
};

export type UsersPublic = {
  data: Array<UserPublic>;
  count: number;
};

export type ValidationError = {
  loc: Array<string | number>;
  msg: string;
  type: string;
};

// class WarehouseItem(SQLModel, table=True):
// warehouse_id: int | None = Field(
//     default=None, foreign_key="warehouse.id", primary_key=True
// )
// item_id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
// quantity: int = Field(default=0)
// warehouse: "Warehouse" = Relationship(back_populates="item_links")
// item: "Item" = Relationship(back_populates="warehouse_links")

export type WarehouseItem = {
  warehouse_id: number;
  item_id: number;
  quantity: number;
};

export type Warehouse = {
  id: number;
  name: string;
  item_links: Array<WarehouseItem>;
};

export type StoreItem = {
  store_id: number;
  item_id: number;
  quantity: number;
};

export type Store = {
  id: number;
  name: string;
  item_links: Array<StoreItem>;
};
