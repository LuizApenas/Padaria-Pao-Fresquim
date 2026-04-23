-- Cria ou atualiza o bucket público de imagens de produtos.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  type
)
values (
  'produtos',
  'produtos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  'STANDARD'
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  type = excluded.type,
  updated_at = now();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Produtos autenticados podem listar imagens'
  ) then
    create policy "Produtos autenticados podem listar imagens"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Produtos autenticados podem enviar imagens'
  ) then
    create policy "Produtos autenticados podem enviar imagens"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Produtos autenticados podem atualizar imagens'
  ) then
    create policy "Produtos autenticados podem atualizar imagens"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'produtos')
    with check (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Produtos autenticados podem remover imagens'
  ) then
    create policy "Produtos autenticados podem remover imagens"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'produtos');
  end if;
end
$$;
