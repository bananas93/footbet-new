import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Button, Card, Modal, TextInput } from 'components';
import { notify } from 'helpers';
import useModal from 'hooks/useModal';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import {
  createRoom,
  deleteRoom,
  getRoomLeaderboard,
  getRooms,
  joinRoomByInviteCode,
  leaveRoom,
} from 'store/slices/room';
import { useTournament } from '../../Tournament';
import styles from './Rooms.module.scss';

const Rooms: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();
  const user = useAppSelector((state) => state.user.user);
  const rooms = useAppSelector((state) => state.room.rooms);
  const roomTable = useAppSelector((state) => state.room.roomTable);
  const isRoomLoading = useAppSelector((state) => state.room.getRoomLeaderboardRequest.isLoading);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [autoJoinAttemptedCode, setAutoJoinAttemptedCode] = useState<string | null>(null);
  const createRoomModal = useModal<void>();
  const joinRoomModal = useModal<void>();

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const isSelectedRoomCreator = !!selectedRoom && user?.id === selectedRoom.creator.id;
  const selectedRoomKey = selectedRoomId ? `${tournament.id}:${selectedRoomId}` : '';
  const leaderboard = selectedRoomId ? roomTable[selectedRoomKey] || [] : [];

  const myRooms = useMemo(() => {
    if (!user) return [];
    return rooms
      .filter((room) => room.participants.some((participant) => participant.id === user.id))
      .sort((a, b) => b.id - a.id);
  }, [rooms, user]);

  useEffect(() => {
    dispatch(getRooms());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRoomId) return;
    dispatch(getRoomLeaderboard({ roomId: selectedRoomId, tournamentId: tournament.id }));
  }, [dispatch, selectedRoomId, tournament.id]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const exists = rooms.some((room) => room.id === selectedRoomId);
    if (!exists) {
      setSelectedRoomId(null);
    }
  }, [rooms, selectedRoomId]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      notify.error('Вкажіть назву кімнати');
      return;
    }

    if (!roomPassword.trim()) {
      notify.error('Для кімнати потрібен пароль');
      return;
    }

    try {
      const result = await dispatch(
        createRoom({
          name: roomName.trim(),
          type: 'private',
          password: roomPassword,
        }),
      ).unwrap();

      setRoomName('');
      setRoomPassword('');
      createRoomModal.closeModal();
      if (result?.roomId) {
        setSelectedRoomId(result.roomId);
      }
      notify.success('Приватну кімнату створено');
    } catch (error: any) {
      notify.error(error.message || 'Не вдалося створити кімнату');
    }
  };

  const handleJoinByInvite = async (providedInviteCode?: unknown) => {
    const rawInviteCode = typeof providedInviteCode === 'string' ? providedInviteCode : inviteCode;
    const normalizedInviteCode = rawInviteCode.trim();

    if (!normalizedInviteCode) {
      notify.error('Вкажіть invite code');
      return;
    }

    try {
      const result = await dispatch(
        joinRoomByInviteCode({
          inviteCode: normalizedInviteCode,
          password: invitePassword || undefined,
        }),
      ).unwrap();

      setInviteCode('');
      setInvitePassword('');
      joinRoomModal.closeModal();

      if (searchParams.get('inviteCode')) {
        setSearchParams((prev) => {
          prev.delete('inviteCode');
          return prev;
        });
      }

      if (result?.roomId) {
        setSelectedRoomId(result.roomId);
      }

      notify.success('Ви приєдналися до кімнати');
    } catch (error: any) {
      notify.error(error.message || 'Невірний invite code або пароль');
    }
  };

  const handleLeaveRoom = async (roomId: number) => {
    try {
      await dispatch(leaveRoom(roomId)).unwrap();
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
      notify.success('Ви покинули кімнату');
    } catch (error: any) {
      notify.error(error.message || 'Не вдалося покинути кімнату');
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await dispatch(deleteRoom(roomId)).unwrap();
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
      notify.success('Кімнату видалено');
    } catch (error: any) {
      notify.error(error.message || 'Не вдалося видалити кімнату');
    }
  };

  const copyInviteLink = async (code?: string) => {
    if (!code) return;

    const link = `${window.location.origin}/tournament/${tournament.id}/rooms?inviteCode=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      notify.success('Посилання-запрошення скопійовано');
    } catch {
      notify.error('Не вдалося скопіювати посилання');
    }
  };

  useEffect(() => {
    const urlInviteCode = searchParams.get('inviteCode');
    if (!urlInviteCode || autoJoinAttemptedCode === urlInviteCode) return;

    setAutoJoinAttemptedCode(urlInviteCode);
    setInviteCode(urlInviteCode);

    dispatch(
      joinRoomByInviteCode({
        inviteCode: urlInviteCode,
      }),
    )
      .unwrap()
      .then((result) => {
        if (result?.roomId) {
          setSelectedRoomId(result.roomId);
        }
        setSearchParams((prev) => {
          prev.delete('inviteCode');
          return prev;
        });
        notify.success('Ви приєдналися до кімнати за запрошенням');
      })
      .catch(() => {
        notify.error('Для цієї кімнати може знадобитися пароль. Введіть пароль та повторіть спробу.');
      });
  }, [autoJoinAttemptedCode, dispatch, searchParams, setSearchParams]);

  return (
    <div className={styles.container}>
      <section className={styles.mainSection}>
        <Card title={selectedRoom ? `Ліга кімнати: ${selectedRoom.name}` : 'Кімнату не обрано'}>
          {!selectedRoom && <p className={styles.empty}>Оберіть кімнату зі списку праворуч, щоб переглянути її таблицю.</p>}
          {selectedRoomId && isRoomLoading ? <p className={styles.empty}>Завантаження таблиці кімнати...</p> : null}

          {selectedRoom && (
            <>
              <div className={styles.selectedRoomActions}>
                {isSelectedRoomCreator ? (
                  <Button variant="secondary" onClick={() => handleDeleteRoom(selectedRoom.id)}>
                    Видалити кімнату
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => handleLeaveRoom(selectedRoom.id)}>
                    Покинути кімнату
                  </Button>
                )}
              </div>
              <div className={styles.tableWrap}>
                <div className={styles.table}>
                  <div className={cn(styles.tableCol, styles.head)}>#</div>
                  <div className={cn(styles.tableCol, styles.head)}>Ім'я</div>
                  <div className={cn(styles.tableCol, styles.head)}>Матчів</div>
                  <div className={cn(styles.tableCol, styles.head)}>Точні</div>
                  <div className={cn(styles.tableCol, styles.head)}>Результат</div>
                  <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Різниці</div>
                  <div className={cn(styles.tableCol, styles.head, styles.hidden)}>5+ голів</div>
                  <div className={cn(styles.tableCol, styles.head)}>Очки</div>
                </div>
                {leaderboard.map((item, index) => (
                  <div className={styles.table} key={item.id}>
                    <div className={styles.tableCol}>{index + 1}</div>
                    <div className={styles.tableCol}>{item.name}</div>
                    <div className={styles.tableCol}>{item.totalMatches}</div>
                    <div className={styles.tableCol}>{item.correctScore}</div>
                    <div className={styles.tableCol}>{item.correctResult}</div>
                    <div className={cn(styles.tableCol, styles.hidden)}>{item.correctDifference}</div>
                    <div className={cn(styles.tableCol, styles.hidden)}>{item.fivePlusGoals}</div>
                    <div className={styles.tableCol}>{item.points}</div>
                  </div>
                ))}
              </div>
              {!leaderboard.length && <p className={styles.empty}>У цій кімнаті поки немає даних.</p>}
            </>
          )}
        </Card>
      </section>

      <aside className={styles.sideSection}>
        <Card title="Приватні кімнати">
          <div className={styles.topActions}>
            <Button onClick={() => joinRoomModal.openModal()} variant="secondary">
              Приєднатися за кодом
            </Button>
            <Button onClick={() => createRoomModal.openModal()}>Створити приватну кімнату</Button>
          </div>

          <h3 className={styles.subTitle}>Мої кімнати</h3>
          <div className={styles.roomsList}>
            {myRooms.map((room) => {
              const isCreator = user?.id === room.creator.id;
              const isSelected = selectedRoomId === room.id;

              return (
                <div
                  className={cn(styles.roomItem, { [styles.roomItemActive]: isSelected })}
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRoomId(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRoomId(room.id);
                    }
                  }}>
                  <div>
                    <p className={styles.roomName}>{room.name}</p>
                    <p className={styles.roomMeta}>Учасників: {room.participants.length}</p>
                  </div>

                  <div className={styles.actions}>
                    {!!room.inviteCode && (
                      <button
                        type="button"
                        className={styles.actionInline}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInviteLink(room.inviteCode);
                        }}>
                        Invite link
                      </button>
                    )}
                    {isCreator ? (
                      <button
                        type="button"
                        className={cn(styles.actionInline, styles.actionDanger)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id);
                        }}>
                        Видалити
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={cn(styles.actionInline, styles.actionDanger)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveRoom(room.id);
                        }}>
                        Вийти
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!myRooms.length && <p className={styles.empty}>У вас поки немає кімнат.</p>}
          </div>
        </Card>
      </aside>

      {createRoomModal.isOpen && (
        <Modal isOpen={createRoomModal.isOpen} onClose={createRoomModal.closeModal} title="Нова приватна кімната">
          <div className={styles.modalForm}>
            <TextInput
              name="roomName"
              label="Назва кімнати"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Назва кімнати"
            />
            <TextInput
              name="roomPassword"
              label="Пароль кімнати"
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="Пароль"
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={createRoomModal.closeModal}>
                Скасувати
              </Button>
              <Button onClick={handleCreateRoom}>Створити</Button>
            </div>
          </div>
        </Modal>
      )}

      {joinRoomModal.isOpen && (
        <Modal isOpen={joinRoomModal.isOpen} onClose={joinRoomModal.closeModal} title="Вхід у кімнату">
          <div className={styles.modalForm}>
            <TextInput
              name="inviteCode"
              label="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Вставте invite code"
            />
            <TextInput
              name="invitePassword"
              label="Пароль (якщо є)"
              type="password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="Пароль"
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={joinRoomModal.closeModal}>
                Скасувати
              </Button>
              <Button onClick={() => handleJoinByInvite()}>Приєднатися</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Rooms;
