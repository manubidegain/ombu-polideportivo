import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { InvitationAcceptForm } from './InvitationAcceptForm';

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch invitation
  const { data: invitation, error } = await supabase
    .from('tournament_invitations')
    .select(
      `
      *,
      tournaments (
        id,
        name,
        start_date,
        sport_type,
        registration_price
      ),
      tournament_categories (
        id,
        name,
        description
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !invitation) {
    notFound();
  }

  // Check if invitation is still valid
  if (invitation.status !== 'pending') {
    const statusMessages = {
      accepted: 'Esta invitación ya fue aceptada',
      rejected: 'Esta invitación fue rechazada',
      expired: 'Esta invitación ha expirado',
    };

    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="font-heading text-[32px] text-[#1b1b1b] mb-4">
            INVITACIÓN NO DISPONIBLE
          </h1>
          <p className="font-body text-[16px] text-gray-600 mb-6">
            {statusMessages[invitation.status as keyof typeof statusMessages] ||
              'Esta invitación no está disponible'}
          </p>
          {invitation.status === 'accepted' && (
            <p className="font-body text-[14px] text-gray-600">
              El equipo <strong>{invitation.team_name}</strong> ya está inscrito en el torneo.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="font-heading text-[32px] text-[#1b1b1b] mb-4">
            INVITACIÓN EXPIRADA
          </h1>
          <p className="font-body text-[16px] text-gray-600 mb-4">
            Esta invitación ha expirado.
          </p>
          <p className="font-body text-[14px] text-gray-600">
            Por favor, contacta a <strong>{invitation.inviter_email}</strong> para que te envíe una
            nueva invitación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-[36px] text-[#1b1b1b] mb-2">
              INVITACIÓN A TORNEO
            </h1>
            <p className="font-body text-[16px] text-gray-600">
              Has sido invitado a participar en un torneo de{' '}
              {invitation.tournaments?.sport_type === 'padel' ? 'pádel' : 'fútbol'}
            </p>
          </div>

          {/* Tournament Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
            <div>
              <p className="font-body text-[12px] text-gray-600 mb-1">Torneo</p>
              <p className="font-heading text-[24px] text-[#1b1b1b]">
                {invitation.tournaments?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-body text-[12px] text-gray-600 mb-1">Fecha de Inicio</p>
                <p className="font-body text-[16px] text-[#1b1b1b]">
                  {invitation.tournaments?.start_date &&
                    format(new Date(invitation.tournaments.start_date), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-600 mb-1">Precio</p>
                <p className="font-body text-[16px] text-[#1b1b1b]">
                  ${invitation.tournaments?.registration_price}
                </p>
              </div>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-600 mb-1">Categoría</p>
              <p className="font-body text-[16px] text-[#1b1b1b]">
                {invitation.tournament_categories?.name}
              </p>
              {invitation.tournament_categories?.description && (
                <p className="font-body text-[14px] text-gray-600">
                  {invitation.tournament_categories.description}
                </p>
              )}
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-600 mb-1">Nombre del Equipo</p>
              <p className="font-body text-[16px] text-[#1b1b1b] font-semibold">
                {invitation.team_name}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-600 mb-1">Compañero</p>
              <p className="font-body text-[16px] text-[#1b1b1b]">{invitation.inviter_email}</p>
            </div>
          </div>

          {/* Accept/Reject Form */}
          <InvitationAcceptForm
            invitationId={invitation.id}
            inviteeEmail={invitation.invitee_email}
          />
        </div>
      </div>
    </div>
  );
}
