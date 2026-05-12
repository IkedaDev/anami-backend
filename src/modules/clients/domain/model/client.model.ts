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
    const {
      id,
      name,
      email,
      phone,
      address,
      rut,
      notes,
      createdAt,
      updatedAt,
    } = props;

    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.rut = rut;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
