-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_income_expenditure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "income_expenditure" TEXT,
    "candidate_party" TEXT,
    "election_name" TEXT,
    "declaration_number_year" TEXT,
    "transaction_date" TEXT,
    "income_expenditure_category" TEXT,
    "donor_recipient" TEXT,
    "id_number" TEXT,
    "income_amount" REAL,
    "expenditure_amount" REAL,
    "donation_method" TEXT,
    "deposit_date" TEXT,
    "return_treasury" TEXT,
    "expenditure_purpose" TEXT,
    "monetary_type" TEXT,
    "address" TEXT,
    "contact_phone" TEXT,
    "disclosed_recipient" TEXT,
    "recipient_internal_name" TEXT,
    "recipient_internal_title" TEXT,
    "party_internal_name" TEXT,
    "party_internal_title" TEXT,
    "relationship" TEXT,
    "correction_note" TEXT,
    "correction_date" TEXT
);
INSERT INTO "new_income_expenditure" ("address", "candidate_party", "contact_phone", "correction_date", "correction_note", "declaration_number_year", "deposit_date", "disclosed_recipient", "donation_method", "donor_recipient", "election_name", "expenditure_amount", "expenditure_purpose", "id", "id_number", "income_amount", "income_expenditure_category", "monetary_type", "party_internal_name", "party_internal_title", "recipient_internal_name", "recipient_internal_title", "relationship", "return_treasury", "transaction_date") SELECT "address", "candidate_party", "contact_phone", "correction_date", "correction_note", "declaration_number_year", "deposit_date", "disclosed_recipient", "donation_method", "donor_recipient", "election_name", "expenditure_amount", "expenditure_purpose", "id", "id_number", "income_amount", "income_expenditure_category", "monetary_type", "party_internal_name", "party_internal_title", "recipient_internal_name", "recipient_internal_title", "relationship", "return_treasury", "transaction_date" FROM "income_expenditure";
DROP TABLE "income_expenditure";
ALTER TABLE "new_income_expenditure" RENAME TO "income_expenditure";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
