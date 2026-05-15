export interface ClientProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rut: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Client {
  public id: string;
  public name: string;
  public email: string;
  public phone: string;
  public address: string;
  public rut: string;
  public notes: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: ClientProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.address = props.address;
    this.rut = props.rut;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
