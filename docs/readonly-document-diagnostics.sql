-- READ-ONLY diagnostics for Group C/D (missing Forum documents, counts, BoldSign completion).
-- Run in the Supabase SQL editor. Contains no writes. Do not edit signed records.

-- 1) Which Forum prep documents exist, and are they approved/released?
select id, title, forum_role, classification, is_forum_prep, signing_approved,
       journey_stage, journey_track, superseded_at, boldsign_template_id is not null as has_template
from documents
where is_forum_prep or forum_role is not null
order by forum_role nulls last, created_at;

-- 2) Stage-1 documents that gate real Forum items (e.g. a historical integration test still active)
select id, title, journey_stage, journey_track, superseded_at
from documents
where journey_stage = 1 and superseded_at is null;

-- 3) BoldSign assignments by status (look for stuck 'pending'/'signed')
select status, count(*) from boldsign_assignments group by status;

select a.id, a.member_id, a.document_id, a.status, a.created_at, a.updated_at
from boldsign_assignments a
where a.status in ('pending','signed')
order by a.updated_at desc
limit 50;

-- 4) Completions recorded for assignments that are still not 'completed'
select a.id, a.status, k.kind, k.acknowledged_at
from boldsign_assignments a
left join acknowledgements k on k.member_id = a.member_id and k.document_id = a.document_id
where a.status <> 'completed' and k.id is not null;
