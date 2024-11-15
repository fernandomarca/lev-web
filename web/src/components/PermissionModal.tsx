import React, { useEffect, useState } from 'react';

interface PermissionModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const PermissionModal = ({ isOpen, onRequestClose }: PermissionModalProps) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // @ts-ignore
        const audioPermission = await navigator.permissions.query({ name: 'microphone' });
        // @ts-ignore
        const videoPermission = await navigator.permissions.query({ name: 'camera' });

        if (audioPermission.state === 'granted' && videoPermission.state === 'granted') {
          setPermissionsGranted(true);
        }

      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
      }
    };
    checkPermissions();
  }, [onRequestClose]);

  const requestPermissions = async () => {
    try {
      const _stream = await navigator.mediaDevices.getUserMedia({
        video: true, audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true
        }
      });
      onRequestClose();
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
    }
  };

  useEffect(() => {
    if (permissionsGranted) {
      onRequestClose();
    }
  }, [onRequestClose, permissionsGranted])

  if (!isOpen && permissionsGranted) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div className="bg-white p-6 rounded shadow-lg text-black">
        <h2 className="text-xl font-bold mb-4">Solicitação de Permissões</h2>
        <p className="mb-4">Precisamos de sua permissão para acessar o microfone e a câmera. Click em permitir</p>
        {/* <div className="flex justify-center">
          <button
            onClick={() => requestPermissions()}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Conceder Permissões
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default PermissionModal;