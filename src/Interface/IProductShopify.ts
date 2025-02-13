export interface IProductShopify {
  id: string;
  title: string;
  image: string;
  handle: string;
  variants: Variant[];
}

interface Variant {
  id: string;
  title: string;
  price: string;
  image: string;
}