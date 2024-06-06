import { useState, useCallback, useEffect } from 'react';

const useModal = <T>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<T | null>(null);

  const openModal = useCallback((data?: T) => {
    if (data) {
      setModalData(data);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setModalData(null);
    }
  }, [isOpen]);

  return { isOpen, openModal, closeModal, modalData };
};

export default useModal;
