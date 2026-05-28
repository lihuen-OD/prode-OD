import toast from 'react-hot-toast';
import ApiError from './ApiError';

export function translateServerMessage(msg: string | undefined, status?: number) {
  if (!msg) return 'Error inesperado';
  // common backend messages
  if (status === 409) return 'Ya existe una participación registrada con ese dato.';
  if (msg.includes('Ruta no encontrada')) return 'Recurso no encontrado.';
  if (msg.includes('Conflicto')) return 'Ya existe un recurso con esos datos.';
  if (msg.includes('El usuario es obligatorio')) return 'Ingresá tu usuario.';
  if (msg.includes('La contraseña es obligatoria')) return 'Ingresá tu contraseña.';
  if (msg.includes('password')) return 'La contraseña es inválida.';
  return msg;
}

export function extractError(err: unknown) {
  if (err instanceof ApiError) {
    const message = translateServerMessage(err.message, err.status);
    return { message, fields: err.fields ?? undefined, raw: err.raw } as const;
  }

  if (err instanceof Error) {
    return { message: err.message, fields: undefined, raw: err } as const;
  }

  return { message: 'Ocurrió un error inesperado', fields: undefined, raw: err } as const;
}

export function showErrorToast(err: unknown) {
  const { message } = extractError(err);
  toast.error(message);
}

export function showSuccessToast(msg: string) {
  toast.success(msg);
}
