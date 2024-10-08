import cn from 'classnames';
import { useAppSelector } from 'store';
import { useTournament } from '../../Tournament';
import { IStandingsItem } from 'interfaces';
import { Card } from 'components';
import { useMobile } from 'hooks';
import styles from './Standings.module.scss';

const Standings: React.FC = () => {
  const { tournament } = useTournament();
  const isMobile = useMobile();

  const standings = useAppSelector((state) => state.tournament.standings)[tournament.id] || [];
  const groups = Object.entries(standings.standings || {});
  const thirdPlace = standings.thirdPlacesStandings;

  return (
    <div className={styles.container}>
      <div className={cn(styles.groups, { [styles.one]: tournament.groupNumber === 1 })}>
        {groups.map((item, index) => {
          const group = item[0] as string;
          const items = item[1] as unknown as IStandingsItem[];
          return (
            <Card
              key={index}
              title={tournament.groupNumber > 1 ? `Група ${group}, ${tournament.name}` : `Турнірна таблиця`}>
              <div className={styles.hint}>
                <div className={styles.hintTeam} />
                <div className={styles.hintStat}>
                  <p className={styles.hintInfo}>{isMobile ? 'М' : 'Матчів'}</p>
                  <p className={cn(styles.hintInfo, styles.hideMobile)} title="Виграв">
                    В
                  </p>
                  <p className={cn(styles.hintInfo, styles.hideMobile)} title="Нічия">
                    Н
                  </p>
                  <p className={cn(styles.hintInfo, styles.hideMobile)} title="Поразка">
                    П
                  </p>
                  <p className={styles.hintInfo}>{isMobile ? 'Голи' : 'Голи'}</p>
                  <p className={styles.hintInfo}>{isMobile ? 'Ф' : 'Форма'}</p>
                  <p className={styles.hintInfo}>{isMobile ? 'Очок' : 'Очок'}</p>
                </div>
              </div>
              {items.map((item: IStandingsItem, index: number) => (
                <div className={styles.group} key={item.id}>
                  <div className={styles.groupTeam}>
                    <p
                      className={cn(styles.groupTeamPosition, {
                        [styles.playoff]: tournament.directNextRound > index,
                        [styles.knockout]:
                          tournament.playoffRound + tournament.directNextRound > index &&
                          tournament.directNextRound <= index,
                      })}>
                      {index + 1}
                    </p>
                    <img
                      src={`${process.env.REACT_APP_UPLOAD_URL}/${item.logo}`}
                      className={styles.groupLogo}
                      alt={item.team}
                    />
                    <p className={styles.groupTeamName}>{item.team}</p>
                  </div>
                  <div className={styles.groupStat}>
                    <p className={styles.groupInfo}>{item.played}</p>
                    <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.won}</p>
                    <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.drawn}</p>
                    <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.lost}</p>
                    <p className={styles.groupInfo}>{`${item.goalsScored}:${item.goalsAgainst}`}</p>
                    <div className={styles.groupInfo}>
                      <div className={styles.groupInfoForm}>
                        {item.form.slice(isMobile ? -3 : 0).map((form, index) => (
                          <span key={index} className={cn(styles[form])} />
                        ))}
                      </div>
                    </div>
                    <p className={styles.groupInfo}>{item.points}</p>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
      {tournament.type === 'national' && (
        <div className={styles.groups}>
          <Card title="Команди які зайняли 3-тє місце">
            <div className={styles.hint}>
              <div className={styles.hintTeam} />
              <div className={styles.hintStat}>
                <p className={styles.hintInfo}>{isMobile ? 'М' : 'Матчів'}</p>
                <p className={cn(styles.hintInfo, styles.hideMobile)} title="Виграв">
                  В
                </p>
                <p className={cn(styles.hintInfo, styles.hideMobile)} title="Нічия">
                  Н
                </p>
                <p className={cn(styles.hintInfo, styles.hideMobile)} title="Поразка">
                  П
                </p>
                <p className={styles.hintInfo}>{isMobile ? 'Голи' : 'Голи'}</p>
                <p className={styles.hintInfo}>{isMobile ? 'Ф' : 'Форма'}</p>
                <p className={styles.hintInfo}>{isMobile ? 'Очок' : 'Очок'}</p>
              </div>
            </div>
            {thirdPlace.map((item: IStandingsItem, index: number) => (
              <div className={styles.group} key={item.id}>
                <div className={styles.groupTeam}>
                  <p
                    className={cn(styles.groupTeamPosition, {
                      [styles.knockout]: index >= 0 && index <= 3,
                    })}
                    title={index === 0 || index === 1 ? 'Плейофф' : ''}>
                    {index + 1}
                  </p>
                  <img
                    src={`${process.env.REACT_APP_UPLOAD_URL}/${item.logo}`}
                    className={styles.groupLogo}
                    alt={item.team}
                  />
                  <p className={styles.groupTeamName}>{item.team}</p>
                </div>
                <div className={styles.groupStat}>
                  <p className={styles.groupInfo}>{item.played}</p>
                  <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.won}</p>
                  <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.drawn}</p>
                  <p className={cn(styles.groupInfo, styles.hideMobile)}>{item.lost}</p>
                  <p className={styles.groupInfo}>{`${item.goalsScored}:${item.goalsAgainst}`}</p>
                  <p className={styles.groupInfo}>
                    <div className={styles.groupInfoForm}>
                      {item.form.map((form, index) => (
                        <span key={index} className={cn(styles[form])} />
                      ))}
                    </div>
                  </p>
                  <p className={styles.groupInfo}>{item.points}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Standings;
