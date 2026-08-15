import { useState, useCallback, useEffect } from 'react';

const useModal = <T>(initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [modalData, setModalData] = useState<T | null>(null);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

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

  return { isOpen, toggle, openModal, closeModal, modalData };
};

export default useModal;
