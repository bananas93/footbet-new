import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Button, Modal, TextInput } from 'components';
import { getUserInitials, notify, resolveAssetUrl } from 'helpers';
import useModal from 'hooks/useModal';
import { Link } from 'react-router-dom';
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

const medalTones = ['gold', 'silver', 'bronze'];

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 3.2l7 2.8v5.4c0 4.1-2.9 7.4-7 8.6-4.1-1.2-7-4.5-7-8.6V6l7-2.8Z" />
    <circle cx="12" cy="10.5" r="2.2" />
    <path d="M8.4 16.4c.7-1.5 2-2.3 3.6-2.3s2.9.8 3.6 2.3" />
  </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="8.5" cy="15.5" r="3.5" />
    <path d="M11 13 19 5M16.5 5H19v2.5" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </svg>
);

const ExitIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7" />
    <path d="M11.5 12h8M16.5 8.5 20 12l-3.5 3.5" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="9.5" cy="9" r="3.2" />
    <path d="M4 19c.6-3 2.7-4.6 5.5-4.6S14.4 16 15 19" />
    <path d="M15.5 6.6a3.2 3.2 0 0 1 0 6.3M17 14.7c2 .6 3.2 2.1 3.6 4.3" />
  </svg>
);

const Rooms: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();
  const user = useAppSelector((state) => state.user.user);
  const rooms = useAppSelector((state) => state.room.rooms);
  const roomTable = useAppSelector((state) => state.room.roomTable);
  const isRoomLoading = useAppSelector((state) => state.room.getRoomLeaderboardRequest.isLoading);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
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

  const totalParticipants = useMemo(
    () => myRooms.reduce((acc, room) => acc + room.participants.length, 0),
    [myRooms],
  );

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

  const handleJoinByInvite = async () => {
    const normalizedInviteCode = inviteCode.trim();

    if (!normalizedInviteCode) {
      notify.error('Вкажіть код кімнати');
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

      if (result?.roomId) {
        setSelectedRoomId(result.roomId);
      }

      notify.success('Ви приєдналися до кімнати');
    } catch (error: any) {
      notify.error(error.message || 'Невірний код кімнати або пароль');
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

  const copyInviteCode = async (code?: string) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      notify.success('Код кімнати скопійовано');
    } catch {
      notify.error('Не вдалося скопіювати код кімнати');
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <ShieldIcon className={styles.heroEyebrowIcon} />
              Приватні кімнати
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>Закриті ліги для друзів: власна таблиця, код запрошення та пароль</p>

            <div className={styles.heroChips}>
              <span className={styles.heroChip}>
                <ShieldIcon className={styles.heroChipIcon} />
                Кімнат: {myRooms.length}
              </span>
              <span className={styles.heroChip}>
                <UsersIcon className={styles.heroChipIcon} />
                Учасників: {totalParticipants}
              </span>
              {!!selectedRoom && <span className={cn(styles.heroChip, styles.heroChipActive)}>{selectedRoom.name}</span>}
            </div>
          </div>

          <div className={styles.heroActions}>
            <button type="button" className={styles.heroGhostButton} onClick={() => joinRoomModal.openModal()}>
              <KeyIcon className={styles.buttonIcon} />
              Приєднатися за кодом
            </button>
            <button type="button" className={styles.heroPrimaryButton} onClick={() => createRoomModal.openModal()}>
              <PlusIcon className={styles.buttonIcon} />
              Створити кімнату
            </button>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <section className={styles.mainSection}>
          {!selectedRoom && (
            <div className={styles.placeholderCard}>
              <span className={styles.placeholderIcon}>
                <ShieldIcon />
              </span>
              <h3 className={styles.placeholderTitle}>Кімнату не обрано</h3>
              <p className={styles.muted}>
                {myRooms.length
                  ? 'Оберіть кімнату зі списку, щоб побачити її таблицю.'
                  : 'Створіть кімнату або приєднайтеся за кодом, щоб почати закриту лігу.'}
              </p>
            </div>
          )}

          {selectedRoom && (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.roomAvatar}>
                  {selectedRoom.creator.avatar ? (
                    <img src={resolveAssetUrl(selectedRoom.creator.avatar)} alt={selectedRoom.creator.name} />
                  ) : (
                    getUserInitials(selectedRoom.creator.name)
                  )}
                </span>
                <div className={styles.panelHeadText}>
                  <h3 className={styles.panelTitle}>{selectedRoom.name}</h3>
                  <p className={styles.panelMeta}>
                    <UsersIcon className={styles.metaIcon} />
                    {selectedRoom.participants.length} учасників
                    <span className={styles.metaDivider} />
                    Власник: {selectedRoom.creator.name}
                  </p>
                </div>

                <div className={styles.panelActions}>
                  {!!selectedRoom.inviteCode && (
                    <button
                      type="button"
                      className={styles.codePill}
                      onClick={() => copyInviteCode(selectedRoom.inviteCode)}
                      title="Скопіювати код кімнати">
                      <span className={styles.codeLabel}>Код</span>
                      <span className={styles.codeValue}>{selectedRoom.inviteCode}</span>
                      <CopyIcon className={styles.buttonIcon} />
                    </button>
                  )}

                  {isSelectedRoomCreator ? (
                    <button
                      type="button"
                      className={cn(styles.pill, styles.pillDanger)}
                      onClick={() => handleDeleteRoom(selectedRoom.id)}>
                      <TrashIcon className={styles.buttonIcon} />
                      Видалити
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={cn(styles.pill, styles.pillDanger)}
                      onClick={() => handleLeaveRoom(selectedRoom.id)}>
                      <ExitIcon className={styles.buttonIcon} />
                      Покинути
                    </button>
                  )}
                </div>
              </div>

              {isRoomLoading && (
                <div className={styles.loading}>
                  {Array.from({ length: 4 }, (_, index) => (
                    <span className={styles.loadingRow} key={index} />
                  ))}
                </div>
              )}

              {!isRoomLoading && !!leaderboard.length && (
                <div className={styles.tableWrap}>
                  <div className={cn(styles.row, styles.headRow)}>
                    <div className={cn(styles.col, styles.colRank)}>#</div>
                    <div className={cn(styles.col, styles.colName)}>Гравець</div>
                    <div className={styles.col}>Матчів</div>
                    <div className={styles.col}>Точні</div>
                    <div className={cn(styles.col, styles.colWide)}>Результат</div>
                    <div className={cn(styles.col, styles.colWide)}>Різниці</div>
                    <div className={cn(styles.col, styles.colWide)}>5+ голів</div>
                    <div className={cn(styles.col, styles.colPoints)}>Очки</div>
                  </div>

                  {leaderboard.map((item, index) => {
                    const rank = index + 1;
                    const tone = rank <= 3 ? medalTones[rank - 1] : null;
                    const isMe = !!user && item.id === user.id;

                    return (
                      <div
                        className={cn(
                          styles.row,
                          { [styles.rowMe]: isMe, [styles.rowTop]: !!tone },
                          tone ? styles[tone] : '',
                        )}
                        key={item.id}>
                        <div className={cn(styles.col, styles.colRank)}>
                          <span className={cn(styles.rank, { [styles.rankMedal]: !!tone })}>{rank}</span>
                        </div>
                        <div className={cn(styles.col, styles.colName)}>
                          <span className={styles.rowAvatar}>
                            {item.avatar ? <img src={resolveAssetUrl(item.avatar)} alt={item.name} /> : getUserInitials(item.name)}
                          </span>
                          <Link
                            to={`/profile/${item.id}?tournamentId=${tournament.id}`}
                            className={styles.userLink}
                            title={item.name}>
                            {item.name}
                          </Link>
                          {isMe && <span className={styles.meChip}>Ви</span>}
                        </div>
                        <div className={styles.col}>{item.totalMatches}</div>
                        <div className={styles.col}>{item.correctScore}</div>
                        <div className={cn(styles.col, styles.colWide)}>{item.correctResult}</div>
                        <div className={cn(styles.col, styles.colWide)}>{item.correctDifference}</div>
                        <div className={cn(styles.col, styles.colWide)}>{item.fivePlusGoals}</div>
                        <div className={cn(styles.col, styles.colPoints)}>
                          <span className={styles.points}>{item.points}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isRoomLoading && !leaderboard.length && (
                <div className={styles.emptyRow}>
                  <span className={styles.placeholderIcon}>
                    <UsersIcon />
                  </span>
                  <p className={styles.placeholderTitle}>У цій кімнаті поки немає даних</p>
                  <p className={styles.muted}>Таблиця з’явиться після перших прогнозів учасників.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className={styles.sideSection}>
          <div className={styles.panel}>
            <div className={styles.sideHead}>
              <h3 className={styles.sideTitle}>Мої кімнати</h3>
              <span className={styles.sideCount}>{myRooms.length}</span>
            </div>

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
                    <div className={styles.roomTop}>
                      <span className={styles.roomBadge}>{getUserInitials(room.name)}</span>
                      <div className={styles.roomInfo}>
                        <div className={styles.roomNameRow}>
                          <p className={styles.roomName} title={room.name}>
                            {room.name}
                          </p>
                          {isCreator && <span className={styles.ownerChip}>Власник</span>}
                        </div>
                        <p className={styles.roomMeta}>Учасників: {room.participants.length}</p>
                      </div>
                    </div>

                    <div className={styles.roomActions}>
                      {!!room.inviteCode && (
                        <button
                          type="button"
                          className={styles.roomAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(room.inviteCode);
                          }}>
                          <CopyIcon className={styles.buttonIcon} />
                          Код
                        </button>
                      )}
                      {isCreator ? (
                        <button
                          type="button"
                          className={cn(styles.roomAction, styles.roomActionDanger)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room.id);
                          }}>
                          <TrashIcon className={styles.buttonIcon} />
                          Видалити
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={cn(styles.roomAction, styles.roomActionDanger)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveRoom(room.id);
                          }}>
                          <ExitIcon className={styles.buttonIcon} />
                          Вийти
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!myRooms.length && (
                <div className={styles.sideEmpty}>
                  <p className={styles.sideEmptyTitle}>У вас поки немає кімнат</p>
                  <p className={styles.muted}>Створіть свою або приєднайтеся за кодом.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {createRoomModal.isOpen && (
        <Modal isOpen={createRoomModal.isOpen} onClose={createRoomModal.closeModal} title="Нова приватна кімната">
          <div className={styles.modalForm}>
            <p className={styles.modalHint}>Пароль знадобиться друзям разом з кодом кімнати.</p>
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
            <p className={styles.modalHint}>Введіть код кімнати, який надіслав власник, та пароль.</p>
            <TextInput
              name="inviteCode"
              label="Код кімнати"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Вставте код кімнати"
            />
            <TextInput
              name="invitePassword"
              label="Пароль"
              type="password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="Пароль"
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={joinRoomModal.closeModal}>
                Скасувати
              </Button>
              <Button onClick={handleJoinByInvite}>Приєднатися</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Rooms;
