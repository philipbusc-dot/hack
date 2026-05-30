import { prisma } from "../../../db";
import type {
    CountryReportInput,
    CountryReport,
} from "../types/countryReport.type";
// Create - add a new report 
export async function createReport(
    input: CountryReportInput
): Promise<CountryReport>{
    return prisma.countryReport.create({data: input});
}
// Read - get all report , newest first
export async function getReports(): Promise<CountryReport[]> {
    return prisma.countryReport.findMany({ orderBy: {createAt: "desc"}});
}
//Update - change report by id 
export async function updateReport(
    id:number,
    input :CountryReportInput)
    : Promise<CountryReport> {
            return prisma.countryReport.update({ where: { id }, data: input })
    }

//Delete - remove a report by id 
export async function deleteReport(id: number): Promise<CountryReport>{
    return prisma.countryReport.delete({ where: { id } });
}