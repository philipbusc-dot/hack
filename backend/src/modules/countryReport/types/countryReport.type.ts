export interface CountryReportInput {
    countryCode : string;
    countryName : string;
    severity: string;
    cases:number;
    note:string;
}
export interface CountryReport extends CountryReportInput {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}