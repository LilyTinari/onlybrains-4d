create table if not exists courses (
  id         serial primary key,
  user_id    text not null,
  topic      text not null,
  title      text not null,
  level      text not null,
  hours      text not null,
  mentor     text not null,
  hook       text not null,
  modules    jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists courses_user_id_idx on courses (user_id);
