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
import { useI18n } from 'i18n';

interface MatchCardProps {
  match: IMatch;
  tournament: ITournament;
}

const stageLabels: Record<string, string> = {
  'Knockout Playoff': 'helpers.matches.round16alt',
  'Round of 16': 'helpers.matches.round8',
  Quarterfinals: 'helpers.matches.round4',
  Semifinals: 'helpers.matches.round2',
  Final: 'helpers.matches.final',
  'Third Place Playoff': 'helpers.matches.thirdPlace',
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
  const { t } = useI18n();
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
  const stageLabel =
    match.stage !== 'Group Stage' ? (stageLabels[match.stage] ? t(stageLabels[match.stage]) : match.stage) : '';
  const matchDetailsHref = `/tournament/${tournament.id}/match/${match.id}`;

  const savePredict = async (home: string, away: string) => {
    if (!isAuthenticated) {
      notify.error(t('pages.matchCard.signInToPredict'));
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

  const renderTeam = (team: IMatch['homeTeam']) => (
    <div className={styles.team}>
      <span className={styles.teamLogo}>
        <Link to={`/tournament/${tournament.id}/team/${team.id}`} className={styles.teamNameLink} title={team.name}>
          <img src={resolveAssetUrl(team.logo)} alt={t('pages.matchCard.teamLogoAlt')} />
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
          aria-label={t('pages.matchCard.openMatchDetails', undefined, {
            home: match.homeTeam.name,
            away: match.awayTeam.name,
          })}
        />

        <div className={cn(styles.toast, { [styles.toastShown]: toastShown })}>
          <CheckIcon />
          {t('pages.matchCard.saved')}
        </div>

        <header className={styles.head}>
          <div className={styles.headChips}>
            {match.groupName && (
              <span className={styles.chip}>
                {tournament.leagues > 1
                  ? `${t('pages.standings.league', undefined, { label: getLeagueLabel(match.tournamentLeague) })} · ${t('pages.matchCard.group', undefined, { name: match.groupName })}`
                  : t('pages.matchCard.group', undefined, { name: match.groupName })}
              </span>
            )}
            {!!stageLabel && <span className={cn(styles.chip, styles.chipStage)}>{stageLabel}</span>}
          </div>

          {isLive ? (
            <span className={cn(styles.chip, styles.chipLive)}>
              <span className={styles.liveDot} />
              {t('pages.status.live')}
            </span>
          ) : isScheduled ? (
            <span className={styles.dateChip}>
              {normalizeMatchDate(match.matchDate)}
              <span className={styles.dateTime}>{normalizeMatchTime(match.matchDate)}</span>
            </span>
          ) : (
            <span className={styles.chip}>{t('pages.status.completed')}</span>
          )}
        </header>

        <div className={styles.body}>
          {renderTeam(match.homeTeam)}

          <div className={styles.center}>
            {isScheduled ? (
              <>
                {isAuthenticated ? (
                  <>
                    <span className={styles.centerLabel}>{t('pages.matchCard.yourPrediction')}</span>
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
                        aria-label={t('pages.matchCard.predictionFor', undefined, { team: match.homeTeam.name })}
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
                        aria-label={t('pages.matchCard.predictionFor', undefined, { team: match.awayTeam.name })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className={styles.centerLabel}>{t('pages.matchCard.predictionsAfterLogin')}</span>
                    <Link
                      to={`${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                      className={styles.predictsButton}>
                      {t('layout.header.signIn')}
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
                    {hasPredict
                      ? t('pages.matchCard.yourPredictionValue', undefined, { home: homeScore, away: awayScore })
                      : t('pages.matchCard.noPrediction')}
                  </span>
                )}
              </>
            )}
          </div>

          {renderTeam(match.awayTeam)}
        </div>

        {!isScheduled && isAuthenticated && (
          <footer className={styles.foot}>
            <div className={styles.pointsWrap}>
              <span className={cn(styles.points, styles[getPointsTone(points)])}>{points}</span>
              <span className={styles.pointsLabel}>
                {t('pages.matchCard.pointsForPrediction', undefined, { points })}
              </span>
            </div>

            <button type="button" className={styles.predictsButton} onClick={openModal}>
              <ListIcon />
              {t('pages.matchCard.allPredictions')}
            </button>
          </footer>
        )}
      </article>

      {isOpen && <ShowPredicts match={match} isOpen={isOpen} onClose={closeModal} />}
    </>
  );
};

export default MatchCard;
