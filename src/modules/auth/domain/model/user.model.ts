export interface UserProps {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

export class User {
  public id: string;
  public name: string;
  public email: string;
  public role: string;
  public password: string;
  constructor(props: UserProps) {
    const { id, name, email, role, password } = props;
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.password = password;
  }

  forAPIResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
    };
  }
}
