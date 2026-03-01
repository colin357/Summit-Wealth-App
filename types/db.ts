export type LoanOfficer = {
  id: string;
  code: string;
  name: string;
  company: string | null;
  nmls: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
};

export type ProfileWithLoanOfficer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  loan_officer_id: string;
  loan_officers: LoanOfficer;
};
