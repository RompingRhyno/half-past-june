export interface Size {
  size: string;
  enabled: boolean;
  stock: string;
}

export interface Variant {
  id: string;
  colour: string;
  colourCode: string;
  price: string;
  stock: string;
  showColorPicker: boolean;
  sizes: Size[];
}