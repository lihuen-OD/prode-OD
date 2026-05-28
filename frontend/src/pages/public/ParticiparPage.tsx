import { Link } from 'react-router-dom';
import { MessageCircle, LogIn } from 'lucide-react';
import { PublicLayout } from '../../layouts/PublicLayout';

const whatsappProofNumber = '3447504626';
const whatsappProofMessage = encodeURIComponent(
  'Hola Lihuen, quiero un usuario y contraseña para iniciar el prode. El pago fue transferido, te paso el comprobante.',
);
const whatsappProofUrl = `https://wa.me/${whatsappProofNumber}?text=${whatsappProofMessage}`;

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
      <path d="M19.07 4.93A9.87 9.87 0 0 0 12.01 2C6.49 2 2 6.48 2 11.99c0 1.76.46 3.48 1.34 4.99L2 22l5.17-1.35a9.96 9.96 0 0 0 4.83 1.23h.01C17.51 21.88 22 17.4 22 11.89c0-2.67-1.04-5.17-2.93-6.96ZM12 20.12h-.01c-1.52 0-3.02-.41-4.32-1.18l-.31-.18-3.07.8.82-2.99-.2-.31a8.12 8.12 0 0 1-1.25-4.35C3.66 7.48 7.2 3.95 11.98 3.95a8.08 8.08 0 0 1 5.74 2.38 8.04 8.04 0 0 1 2.38 5.74c0 4.77-3.52 8.05-8.1 8.05Zm4.69-6.41c-.26-.13-1.56-.77-1.8-.86-.24-.09-.42-.13-.6.13-.18.26-.69.86-.85 1.03-.16.18-.31.2-.57.07-.26-.13-1.1-.41-2.1-1.29-.78-.7-1.3-1.56-1.45-1.82-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.18.04-.34-.02-.47-.06-.13-.6-1.45-.82-1.99-.22-.53-.44-.46-.6-.47h-.51c-.18 0-.47.07-.72.34-.25.26-.97.95-.97 2.3 0 1.35.98 2.65 1.12 2.83.13.18 1.95 2.98 4.73 4.18.66.29 1.17.46 1.57.59.66.21 1.26.18 1.73.11.53-.08 1.56-.64 1.78-1.25.22-.61.22-1.13.16-1.24-.06-.11-.24-.18-.5-.31Z" />
    </svg>
  );
}

export function ParticiparPage() {
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg max-w-full animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 sm:px-8 py-7 sm:py-8 text-center">
              <div className="text-4xl sm:text-5xl mb-3">⚽</div>
              <h1 className="text-white text-xl sm:text-2xl font-black font-display break-words">¿Cómo participar?</h1>
              <p className="text-blue-200 text-sm mt-1">Prode Mundial 2026 · Club Deportivo Barú</p>
            </div>

            <div className="px-5 sm:px-8 py-7 sm:py-8">
              {/* Steps */}
              <div className="space-y-5 mb-8">
                {[
                  {
                    step: '01',
                    title: 'Hablá con el administrador',
                    description: 'Contactate con el administrador del prode para solicitar tu participación y recibir la información de inscripción.',
                  },
                  {
                    step: '02',
                    title: 'Realizá la transferencia',
                    description: 'El monto de inscripción es de $10.000.',
                    transferAlias: 'lihuensg',
                    extraDescription: 'Una vez realizada la transferencia, enviá el comprobante al administrador.',
                  },
                  {
                    step: '03',
                    icon: <LogIn className="w-5 h-5 text-blue-600" />,
                    title: 'Recibís tu acceso',
                    description: 'Una vez confirmado el pago, el administrador crea tu usuario y contraseña para ingresar a la plataforma.',
                  },
                  {
                    step: '04',
                    title: '¡Empezá a pronosticar!',
                    description: 'Ingresás con tu usuario y empezás a cargar tus pronósticos para la fase de grupos.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      {item.icon || <span className="text-blue-600 font-black text-sm">{item.step}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-400 mb-0.5">PASO {item.step}</p>
                      <p className="font-semibold text-slate-800 text-sm break-words">{item.title}</p>
                      <p className="text-slate-500 text-sm mt-0.5 break-words">{item.description}</p>
                      {item.transferAlias && (
                        <p className="text-slate-500 text-sm mt-0.5 break-words">
                          El alias para realizar la transferencia es: <strong className="text-slate-700">{item.transferAlias}</strong>
                        </p>
                      )}
                      {item.extraDescription && <p className="text-slate-500 text-sm mt-0.5 break-words">{item.extraDescription}</p>}
                      {item.step === '02' && (
                        <a
                          href={whatsappProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex w-auto max-w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(30,64,175,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_24px_rgba(30,64,175,0.32)] active:translate-y-0"
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#25D366]">
                            <WhatsAppIcon />
                          </span>
                          Solicitar usuario por WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 mb-6 max-w-full">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-800 text-sm mb-1">No existe registro libre</p>
                    <p className="text-blue-700 text-sm break-words">
                      Los usuarios son creados exclusivamente por el administrador del club luego de verificar correctamente el pago de la inscripción.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full max-w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Ya tengo usuario — Iniciar sesión
                </Link>
                <Link
                  to="/"
                  className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
