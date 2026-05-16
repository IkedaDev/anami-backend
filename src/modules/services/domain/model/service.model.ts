interface ServiceProps {
  id: string;
  name: string;
  description: string;
  available: boolean;
  basePrice: number;
  durationMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Service {
  public id: string;
  public name: string;
  public description: string;
  public basePrice: number;
  public available: boolean;
  public durationMin: number;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: ServiceProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.available = props.available;
    this.basePrice = props.basePrice;
    this.durationMin = props.durationMin;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
