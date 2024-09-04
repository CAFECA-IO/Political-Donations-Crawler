import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Record {
  income_expenditure: string;
  candidate_party: string;
  election_name: string;
  declaration_number_year: string;
  transaction_date: string;
  income_expenditure_category: string;
  donor_recipient: string;
  id_number: string;
  income_amount: number;
  expenditure_amount: number;
  donation_method: string;
  deposit_date: string;
  return_treasury: string;
  expenditure_purpose: string;
  monetary_type: string;
  address: string;
  contact_phone: string;
  disclosed_recipient: string;
  recipient_internal_name: string;
  recipient_internal_title: string;
  party_internal_name: string;
  party_internal_title: string;
  relationship: string;
  correction_note: string;
  correction_date: string;
}

async function importCsv(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const records: Record[] = [];
    const isIncomePath = filePath.includes('incomes');
    const isExpenditurePath = filePath.includes('expenditures');
    let type = '';
    if (isIncomePath) {
      type = '收入';
    } else if (isExpenditurePath) {
      type = '支出';
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        const record: Record = {
          income_expenditure: isIncomePath ? 'income' : isExpenditurePath ? 'expenditure' : '',
          candidate_party: row['擬參選人／政黨'],
          election_name: row['選舉名稱'],
          declaration_number_year: row['申報序號／年度'],
          transaction_date: row['交易日期'],
          income_expenditure_category: row['收支科目'],
          donor_recipient: row['捐贈者／支出對象'],
          id_number: row['身分證／統一編號'],
          income_amount: Number(row['收入金額']),
          expenditure_amount: Number(row['支出金額']),
          donation_method: row['捐贈方式'],
          deposit_date: row['存入專戶日期'],
          return_treasury: row['返還/繳庫'],
          expenditure_purpose: row['支出用途'],
          monetary_type: row['金錢類'],
          address: row['地址'],
          contact_phone: row['聯絡電話'],
          disclosed_recipient: row['應揭露之支出對象'],
          recipient_internal_name: row['支出對象之內部人員姓名'],
          recipient_internal_title: row['支出對象之內部人員職稱'],
          party_internal_name: row['政黨之內部人員姓名'],
          party_internal_title: row['政黨之內部人員職稱'],
          relationship: row['關係'],
          correction_note: row['更正註記'],
          correction_date: row['資料更正日期'],
        };
        records.push(record);
      })
      .on('end', async () => {
        console.log(`${type} CSV file successfully processed`);
        try {
          console.log(`start inserting ${type} records...`);
          // 批量插入資料
          await prisma.income_expenditure.createMany({
            data: records,
          });
          console.log(`All ${type} records have been inserted`);
          resolve();
        } catch (error) {
          console.error(`Error inserting ${type} records:`, error);
          reject(error);
        } finally {
          await prisma.$disconnect();
        }
      })
      .on('error', (error) => {
        console.error(`Error reading ${type} CSV file:`, error);
        reject(error);
      });
  });
}

async function importData() {
  try {
    const incomesPath = path.resolve(__dirname, 'downloads/incomes.csv');
    const expendituresPath = path.resolve(__dirname, 'downloads/expenditures.csv');
    
    // 先匯入支出資料
    await importCsv(expendituresPath);
    console.log('支出資料匯入完成');
    
    // 再匯入收入資料
    await importCsv(incomesPath);
    console.log('收入資料匯入完成');
  } catch (error) {
    console.error('匯入過程中發生錯誤：', error);
  }
}

importData();