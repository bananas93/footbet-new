import { useState } from 'react';
import cn from 'classnames';
import { Link, useLocation } from 'react-router-dom';
import { IMatch, ITournament, MatchStatus } from 'interfaces';
import { getLeagueLabel, normalizeMatchDate, normalizeMatchTime, notify, resolveAssetUrl } from 'helpers';
import { useAppDispatch, useAppSelector } from 'store';
import { setPredict } from 'store/slices/predict';
import useModal from 'hooks/useModal';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import ShowPredicts from '../ShowPredicts/ShowPredicts';
import styles from './MatchCard.module.scss';

interface MatchCardProps {
  match: IMatch;
  tournament: ITournament;
}

const stageLabels: Record<string, string> = {
  'Knockout Playoff': 'Раунд плей-оф',
  'Round of 16': '1/8 фіналу',
  Quarterfinals: '1/4 фіналу',
  Semifinals: '1/2 фіналу',
  Final: 'Фінал',
  'Third Place Playoff': 'Матч за 3-тє місце',
};

const getPointsTone = (points: number) => {
  if (points >= 6) {
    return 'orange';
  }

  if (points >= 5) {
    return 'gold';
  }

  if (points >= 3) {
    return 'teal';
  }

  if (points >= 2) {
    return 'blue';
  }

  return 'neutral';
};

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.toastIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const ListIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.buttonIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M9 7h11M9 12h11M9 17h11" />
    <circle cx="5" cy="7" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="5" cy="17" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const MatchCard: React.FC<MatchCardProps> = ({ match, tournament }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { isOpen, openModal, closeModal } = useModal();

  const [homeScore, setHomeScore] = useState<string>(match?.predict?.homeScore.toString() || '');
  const [awayScore, setAwayScore] = useState<string>(match?.predict?.awayScore.toString() || '');

  const [toastShown, setToastShown] = useState<boolean>(false);

  const isScheduled = match.status === MatchStatus.SCHEDULED;
  const isLive = match.status === MatchStatus.IN_PROGRESS;
  const points = match?.predict?.points || 0;
  const hasPredict = homeScore !== '' && awayScore !== '';
  const stageLabel = match.stage !== 'Group Stage' ? stageLabels[match.stage] || match.stage : '';
  const matchDetailsHref = `/tournament/${tournament.id}/match/${match.id}`;

  const savePredict = async (home: string, away: string) => {
    if (!isAuthenticated) {
      notify.error('Увійдіть, щоб зробити прогноз');
      return;
    }

    try {
      const predict = {
        matchId: match.id,
        homeScore: Number(home),
        awayScore: Number(away),
        tournamentId: tournament.id,
      };
      await dispatch(setPredict(predict)).unwrap();
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'home') {
      setHomeScore(value);
      if (value && awayScore) {
        setTimeout(async () => {
          await savePredict(value, awayScore);
          setToastShown(true);
          e.target.blur();
          setTimeout(() => {
            setToastShown(false);
          }, 2000);
        }, 1000);
      }
    } else {
      setAwayScore(value);
      if (homeScore && value) {
        setTimeout(async () => {
          await savePredict(homeScore, value);
          e.target.blur();
          setToastShown(true);
          setTimeout(() => {
            setToastShown(false);
          }, 2000);
        }, 1000);
      }
    }
  };

  const renderTeam = (team: IMatch['homeTeam'], side: 'home' | 'away') => (
    <div className={styles.team}>
      <span className={styles.teamLogo}>
        <Link to={`/tournament/${tournament.id}/team/${team.id}`} className={styles.teamNameLink} title={team.name}>
          <img src={resolveAssetUrl(team.logo)} alt={`${side} team logo`} />
        </Link>
      </span>
      {team?.id ? (
        <Link to={`/tournament/${tournament.id}/team/${team.id}`} className={styles.teamNameLink} title={team.name}>
          {team.name}
        </Link>
      ) : (
        <span className={styles.teamName} title={team.name}>
          {team.name}
        </span>
      )}
    </div>
  );

  return (
    <>
      <article className={cn(styles.card, { [styles.live]: isLive, [styles.finished]: !isScheduled && !isLive })}>
        <Link
          to={matchDetailsHref}
          className={styles.cardLink}
          aria-label={`Відкрити деталі матчу ${match.homeTeam.name} - ${match.awayTeam.name}`}
        />

        <div className={cn(styles.toast, { [styles.toastShown]: toastShown })}>
          <CheckIcon />
          Прогноз збережено
        </div>

        <header className={styles.head}>
          <div className={styles.headChips}>
            {match.groupName && (
              <span className={styles.chip}>
                {tournament.leagues > 1
                  ? `Ліга ${getLeagueLabel(match.tournamentLeague)} · Група ${match.groupName}`
                  : `Група ${match.groupName}`}
              </span>
            )}
            {!!stageLabel && <span className={cn(styles.chip, styles.chipStage)}>{stageLabel}</span>}
          </div>

          {isLive ? (
            <span className={cn(styles.chip, styles.chipLive)}>
              <span className={styles.liveDot} />
              Live
            </span>
          ) : isScheduled ? (
            <span className={styles.dateChip}>
              {normalizeMatchDate(match.matchDate)}
              <span className={styles.dateTime}>{normalizeMatchTime(match.matchDate)}</span>
            </span>
          ) : (
            <span className={styles.chip}>Завершено</span>
          )}
        </header>

        <div className={styles.body}>
          {renderTeam(match.homeTeam, 'home')}

          <div className={styles.center}>
            {isScheduled ? (
              <>
                {isAuthenticated ? (
                  <>
                    <span className={styles.centerLabel}>Ваш прогноз</span>
                    <div className={styles.inputs}>
                      <input
                        name="home"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={homeScore}
                        onChange={handleChange}
                        className={styles.input}
                        aria-label={`Прогноз для ${match.homeTeam.name}`}
                      />
                      <span className={styles.inputsDivider}>:</span>
                      <input
                        name="away"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={awayScore}
                        onChange={handleChange}
                        className={styles.input}
                        aria-label={`Прогноз для ${match.awayTeam.name}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className={styles.centerLabel}>Прогнози доступні після входу</span>
                    <Link
                      to={`${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                      className={styles.predictsButton}>
                      Увійти
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <div className={cn(styles.score, { [styles.scoreLive]: isLive })}>
                  <span className={styles.scoreValue}>{match.homeScore}</span>
                  <span className={styles.scoreDash}>:</span>
                  <span className={styles.scoreValue}>{match.awayScore}</span>
                </div>
                {isAuthenticated && (
                  <span className={styles.predictChip}>
                    {hasPredict ? `Ваш прогноз ${homeScore}:${awayScore}` : 'Прогнозу не було'}
                  </span>
                )}
              </>
            )}
          </div>

          {renderTeam(match.awayTeam, 'away')}
        </div>

        {!isScheduled && isAuthenticated && (
          <footer className={styles.foot}>
            <div className={styles.pointsWrap}>
              <span className={cn(styles.points, styles[getPointsTone(points)])}>{points}</span>
              <span className={styles.pointsLabel}>{points === 1 ? 'очко' : 'очок'} за прогноз</span>
            </div>

            <button type="button" className={styles.predictsButton} onClick={openModal}>
              <ListIcon />
              Всі прогнози
            </button>
          </footer>
        )}
      </article>

      {isOpen && <ShowPredicts match={match} isOpen={isOpen} onClose={closeModal} />}
    </>
  );
};

export default MatchCard;
