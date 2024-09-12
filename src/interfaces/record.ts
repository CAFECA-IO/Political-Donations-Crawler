export interface Record {
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


export interface RecordObj extends Record {
    id: number;
}
