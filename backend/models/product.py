from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    description: str = Field(max_length=500)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image: str = Field(max_length=500)
    metal: str = Field(max_length=100)
    gemstone: str | None = Field(default=None, max_length=100)
    weight: str = Field(max_length=100)
    rating: float = Field(ge=0, le=5)
    color: str = Field(max_length=100)
    material: str = Field(max_length=100)
    reviews: int = Field(ge=0)


class Product(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    description: str
    price: float
    stock: int
    image: str
    metal: str
    gemstone: str | None
    weight: str
    rating: float
    color: str
    material: str
    reviews: int
    active: bool
