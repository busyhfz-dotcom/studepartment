-- Postings from institutions that are not verified yet are held instead of going public.
ALTER TYPE "OpportunityStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
