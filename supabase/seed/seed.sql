insert into public.loan_officers (code, name, company, nmls, phone, email, photo_url)
values
  ('DREW123', 'Drew Harper', 'Summit Home Lending', '142001', '+1-555-111-2233', 'drew@summitlending.com', 'https://picsum.photos/seed/drew/200'),
  ('FAIRWAY77', 'Maya Chen', 'Fairway Funding Group', '208411', '+1-555-334-7788', 'maya@fairwayfunding.com', 'https://picsum.photos/seed/maya/200')
on conflict (code) do update set
  name = excluded.name,
  company = excluded.company,
  nmls = excluded.nmls,
  phone = excluded.phone,
  email = excluded.email,
  photo_url = excluded.photo_url;
