drop policy "Only admins can delete photos" on "public"."tournament_photos";

drop policy "Only admins can update photos" on "public"."tournament_photos";

drop policy "Only admins can upload photos" on "public"."tournament_photos";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$function$
;


  create policy "Admins can delete photos"
  on "public"."tournament_photos"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "Admins can update photos"
  on "public"."tournament_photos"
  as permissive
  for update
  to public
using (public.is_admin());



  create policy "Admins can upload photos"
  on "public"."tournament_photos"
  as permissive
  for insert
  to public
with check (public.is_admin());



  create policy "Admins can manage all files"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'tournament-photos'::text) AND (((auth.jwt() ->> 'role'::text) = 'admin'::text) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT users.email
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))))));



  create policy "Anyone can view tournament photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'tournament-photos'::text));



  create policy "Authenticated users can delete tournament photos"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'tournament-photos'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Authenticated users can update tournament photos"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'tournament-photos'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Authenticated users can upload tournament photos 1zq7s5_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'tournament-photos'::text));



  create policy "Authenticated users can upload tournament photos"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'tournament-photos'::text) AND (auth.uid() IS NOT NULL)));



  create policy "Authenticated users can upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'tournament-photos'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'tournament-photos'::text));



  create policy "Users can delete own files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'tournament-photos'::text) AND (auth.uid() = owner)));



  create policy "Users can update own files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'tournament-photos'::text) AND (auth.uid() = owner)));



