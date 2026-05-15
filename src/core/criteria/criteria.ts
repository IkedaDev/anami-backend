export enum FilterOperator {
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  GT = "GT",
  GTE = "GTE",
  LT = "LT",
  LTE = "LTE",
  CONTAINS = "CONTAINS",
  IN = "IN",
  NOT_IN = "NOT_IN",
}

export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date;

export interface Condition {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

export interface LogicalGroup {
  logic: "AND" | "OR";
  filters: FilterNode[];
}

export type FilterNode = Condition | LogicalGroup;

export enum OrderType {
  ASC = "asc",
  DESC = "desc",
}

interface CriteriaProps {
  filters: FilterNode[];
  orderBy?: string;
  orderType?: OrderType;
  pagination?: CriteriaPagination;
}

interface CriteriaPagination {
  limit?: number;
  page?: number;
}

export class Criteria {
  public readonly filters: FilterNode[];
  public readonly orderBy?: string;
  public readonly orderType: OrderType;
  public readonly pagination?: CriteriaPagination;
  constructor(props: CriteriaProps) {
    this.filters = props.filters || [];
    this.orderBy = props.orderBy;
    this.orderType = props.orderType || OrderType.ASC;
    this.pagination = props.pagination;
  }

  public hasFilters(): boolean {
    return this.filters.length > 0;
  }
}
