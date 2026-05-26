import { AppointmentStatus, LocationType } from "@prisma/client";

export interface AppointmentItemProps {
  id?: string;
  appointmentId?: string;
  serviceId: string;
  serviceName: string;
  priceAtTime: number;
}

export interface AppointmentProps {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  totalPrice: number;
  anamiShare: number;
  hotelShare: number;
  locationType: LocationType;
  hasNailCut: boolean;
  facialType: string | null;
  items?: AppointmentItemProps[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment {
  public id: string;
  public clientId: string;
  public clientName?: string;
  public clientPhone?: string;
  public startsAt: Date;
  public endsAt: Date;
  public durationMinutes: number;
  public status: AppointmentStatus;
  public totalPrice: number;
  public anamiShare: number;
  public hotelShare: number;
  public locationType: LocationType;
  public hasNailCut: boolean;
  public facialType: string | null;
  public items?: AppointmentItemProps[];
  public notes?: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: AppointmentProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.clientName = props.clientName;
    this.clientPhone = props.clientPhone;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this.durationMinutes = props.durationMinutes;
    this.status = props.status;
    this.totalPrice = props.totalPrice;
    this.anamiShare = props.anamiShare;
    this.hotelShare = props.hotelShare;
    this.locationType = props.locationType;
    this.hasNailCut = props.hasNailCut;
    this.facialType = props.facialType;
    this.items = props.items;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
