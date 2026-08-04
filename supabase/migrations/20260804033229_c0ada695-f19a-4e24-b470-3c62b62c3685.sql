
-- Demo college
INSERT INTO public.colleges (id, name, code, email, phone, whatsapp_number, address, support_contact, payment_link, reminder_language)
VALUES ('11111111-1111-4111-8111-111111111111','Sri Krishna College of Engineering','SKCE','office@skce.edu.in','+914224302222','+919876543210','Kuniamuthur, Coimbatore 641008','+919876543210','https://pay.skce.edu.in/fees','both')
ON CONFLICT (id) DO NOTHING;

-- Promote the existing account to college admin of the demo college
UPDATE public.profiles SET college_id = '11111111-1111-4111-8111-111111111111'
WHERE id = 'e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e';

INSERT INTO public.user_roles (user_id, role)
VALUES ('e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e','college_admin'),
       ('e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e','super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Students
INSERT INTO public.students (id, college_id, full_name, register_number, department, course, year, semester, section, student_phone, parent_phone, student_email, parent_email, address)
VALUES
 ('22222222-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Aravind Kumar','SKCE21CS001','Computer Science','B.E. CSE',3,6,'A','+919000000001','+919000000101','aravind.k@skce.edu.in','parent.aravind@gmail.com','Gandhipuram, Coimbatore'),
 ('22222222-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Divya Lakshmi','SKCE21CS002','Computer Science','B.E. CSE',3,6,'A','+919000000002','+919000000102','divya.l@skce.edu.in','parent.divya@gmail.com','Peelamedu, Coimbatore'),
 ('22222222-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Mohammed Rizwan','SKCE22EC014','Electronics','B.E. ECE',2,4,'B','+919000000003','+919000000103','rizwan.m@skce.edu.in','parent.rizwan@gmail.com','Ukkadam, Coimbatore'),
 ('22222222-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Sneha Ravi','SKCE22ME008','Mechanical','B.E. MECH',2,3,'A','+919000000004','+919000000104','sneha.r@skce.edu.in','parent.sneha@gmail.com','Saibaba Colony, Coimbatore'),
 ('22222222-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Karthik Subramani','SKCE20IT031','Information Technology','B.Tech IT',4,8,'A','+919000000005','+919000000105','karthik.s@skce.edu.in','parent.karthik@gmail.com','RS Puram, Coimbatore'),
 ('22222222-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','Priya Dharshini','SKCE23CS077','Computer Science','B.E. CSE',1,2,'C','+919000000006','+919000000106','priya.d@skce.edu.in','parent.priya@gmail.com','Singanallur, Coimbatore'),
 ('22222222-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','Vignesh Balaji','SKCE21EE045','Electrical','B.E. EEE',3,5,'B','+919000000007','+919000000107','vignesh.b@skce.edu.in','parent.vignesh@gmail.com','Thudiyalur, Coimbatore'),
 ('22222222-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','Anitha Selvam','SKCE22CS119','Computer Science','B.E. CSE',2,4,'A','+919000000008','+919000000108','anitha.s@skce.edu.in','parent.anitha@gmail.com','Kovaipudur, Coimbatore'),
 ('22222222-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','Hari Prasath','SKCE20CE012','Civil','B.E. CIVIL',4,7,'A','+919000000009','+919000000109','hari.p@skce.edu.in','parent.hari@gmail.com','Vadavalli, Coimbatore'),
 ('22222222-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','Meenakshi Iyer','SKCE23EC090','Electronics','B.E. ECE',1,1,'B','+919000000010','+919000000110','meena.i@skce.edu.in','parent.meena@gmail.com','Sulur, Coimbatore')
ON CONFLICT (id) DO NOTHING;

-- Fee records (status and balance auto-computed)
INSERT INTO public.fee_records (id, student_id, college_id, academic_year, term, total_fee, paid_fee, scholarship, discount, late_fee, due_date, notes)
VALUES
 ('33333333-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','2025-2026','Semester 6',85000,85000,0,0,0, CURRENT_DATE + 20,'Full payment received'),
 ('33333333-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','2025-2026','Semester 6',85000,40000,5000,0,0, CURRENT_DATE + 7,'Part payment'),
 ('33333333-0000-4000-8000-000000000003','22222222-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','2025-2026','Semester 4',78000,0,0,0,1000, CURRENT_DATE - 12,'No payment yet'),
 ('33333333-0000-4000-8000-000000000004','22222222-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','2025-2026','Semester 3',72000,30000,0,2000,0, CURRENT_DATE - 3,'Balance pending'),
 ('33333333-0000-4000-8000-000000000005','22222222-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','2025-2026','Semester 8',90000,90000,0,0,0, CURRENT_DATE - 30,'Cleared'),
 ('33333333-0000-4000-8000-000000000006','22222222-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','2025-2026','Semester 2',80000,0,20000,0,0, CURRENT_DATE + 15,'Scholarship applied'),
 ('33333333-0000-4000-8000-000000000007','22222222-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','2025-2026','Semester 5',76000,50000,0,0,0, CURRENT_DATE + 3,'Second instalment due'),
 ('33333333-0000-4000-8000-000000000008','22222222-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','2025-2026','Semester 4',78000,78000,0,0,0, CURRENT_DATE + 10,'Cleared'),
 ('33333333-0000-4000-8000-000000000009','22222222-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','2025-2026','Semester 7',88000,20000,0,0,2000, CURRENT_DATE - 25,'Overdue, reminders sent'),
 ('33333333-0000-4000-8000-000000000010','22222222-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','2025-2026','Semester 1',80000,0,0,0,0, CURRENT_DATE + 1,'First term fee')
ON CONFLICT (id) DO NOTHING;

-- Reminder history
INSERT INTO public.reminder_logs (college_id, student_id, fee_record_id, channel, recipient, recipient_value, stage, status, message_body, sent_at)
VALUES
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003','whatsapp','parent','+919000000103','after_7','delivered','Dear parent, fee of Rs.79000 for Mohammed Rizwan is overdue. Kindly pay at https://pay.skce.edu.in/fees', now() - interval '2 days'),
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000003','email','student','rizwan.m@skce.edu.in','after_1','sent','Reminder: your semester 4 fee balance is pending.', now() - interval '8 days'),
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000004','whatsapp','student','+919000000004','due_today','delivered','Your fee balance of Rs.40000 is due today.', now() - interval '3 days'),
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000007','33333333-0000-4000-8000-000000000007','whatsapp','parent','+919000000107','before_3','sent','Fee of Rs.26000 for Vignesh Balaji is due in 3 days.', now() - interval '4 hours'),
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000009','33333333-0000-4000-8000-000000000009','whatsapp','parent','+919000000109','after_7','failed','Overdue notice for Hari Prasath.', now() - interval '1 day'),
 ('11111111-1111-4111-8111-111111111111','22222222-0000-4000-8000-000000000010','33333333-0000-4000-8000-000000000010','email','parent','parent.meena@gmail.com','before_15','delivered','Upcoming fee due for Meenakshi Iyer.', now() - interval '14 days');

-- Notifications for the admin account
INSERT INTO public.notifications (user_id, college_id, title, body, type, is_read)
VALUES
 ('e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e','11111111-1111-4111-8111-111111111111','2 fee records went overdue','Mohammed Rizwan and Hari Prasath crossed their due dates.','warning',false),
 ('e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e','11111111-1111-4111-8111-111111111111','Reminder batch completed','6 reminders processed, 1 failed delivery.','info',false),
 ('e3fd1c24-64ed-4fbe-960b-d760e3cf7d1e','11111111-1111-4111-8111-111111111111','Payment received','Anitha Selvam cleared Rs.78000.','success',true);
