import { useState } from 'react';
import cn from 'classnames';
import { Card, TextInput } from 'components';
import { IMatch, ITournament } from 'interfaces';
import { normalizeMatchDate, normalizeMatchTime, notify } from 'helpers';
import { useAppDispatch } from 'store';
import { setPredict } from 'store/slices/predict';
import styles from './MatchCard.module.scss';
import { useMatchMinute } from 'hooks';
import ShowPredicts from '../ShowPredicts/ShowPredicts';
import useModal from 'hooks/useModal';
import { MoreIcon } from 'assets/icons';

interface MatchCardProps {
  match: IMatch;
  tournament: ITournament;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, tournament }) => {
  const dispatch = useAppDispatch();
  const matchMinute = useMatchMinute(match);

  const { isOpen, openModal, closeModal } = useModal();

  const [homeScore, setHomeScore] = useState<string>(match?.predict?.homeScore.toString() || '');
  const [awayScore, setAwayScore] = useState<string>(match?.predict?.awayScore.toString() || '');

  const [toastShown, setToastShown] = useState<boolean>(false);

  const savePredict = async (home: string, away: string) => {
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

  return (
    <>
      <Card className={styles.match}>
        <div className={cn(styles.matchToast, { [styles.shown]: toastShown })}>Прогноз збережено</div>
        {match.status === 'Live' && (
          <div className={styles.matchLive}>
            <span className={styles.matchLiveBlock}>
              <span></span>
              Live
            </span>
            <span className={styles.matchMinute}>
              {matchMinute}
              <span>'</span>
            </span>
          </div>
        )}
        <div key={match.id}>
          {match.status !== 'Scheduled' && (
            <div className={styles.matchPoints}>
              <div
                className={cn(styles.matchPointsReward, {
                  [styles.success]: match?.predict?.points > 4,
                  [styles.norm]: match?.predict?.points > 0 && match?.predict?.points < 5,
                  [styles.bad]: match?.predict?.points === 0,
                })}>
                <span>{match?.predict?.points || 0}</span>
              </div>
              <button className={styles.matchPredicts} onClick={openModal}>
                <MoreIcon />
              </button>
            </div>
          )}
          <div className={styles.matchWrap}>
            {match.groupName && (
              <div className={styles.matchGroup}>
                <span className={styles.matchGroupName}>Група {match.groupName}</span>
              </div>
            )}
            <div className={styles.matchDate}>
              {match.status !== 'Scheduled' ? (
                <div className={cn(styles.matchScore, { [styles.live]: match.status === 'Live' })}>
                  {match.status === 'Finished' && 'Результат: '}
                  <span>{match.homeScore}</span>
                  <span>-</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : (
                <>
                  <span>{normalizeMatchDate(match.matchDate)}</span> <span>{normalizeMatchTime(match.matchDate)}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.matchTeam}>
            <div className={styles.matchTeamWrap}>
              <img
                src={`${process.env.REACT_APP_UPLOAD_URL}/${match.homeTeam.logo}`}
                alt="home team logo"
                className={styles.matchTeamLogo}
              />
              <span className={styles.matchTeamName}>{match.homeTeam.name}</span>
            </div>
            <div className={styles.matchPredict}>
              {match.status === 'Scheduled' ? (
                <>
                  <TextInput
                    name="home"
                    placeholder=""
                    type="tel"
                    value={homeScore}
                    onChange={handleChange}
                    pattern="[0-9]"
                    maxLength={1}
                  />
                  <TextInput
                    placeholder=""
                    name="away"
                    type="tel"
                    value={awayScore}
                    onChange={handleChange}
                    pattern="[0-9]"
                    maxLength={1}
                  />
                </>
              ) : (
                <div className={styles.matchPredictLive}>
                  <div className={styles.matchPredictPredict}>
                    <span>{homeScore}</span>
                    <span>{awayScore}</span>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.matchTeamWrap}>
              <img
                src={`${process.env.REACT_APP_UPLOAD_URL}/${match.awayTeam.logo}`}
                alt="away team logo"
                className={styles.matchTeamLogo}
              />
              <span className={styles.matchTeamName}>{match.awayTeam.name}</span>
            </div>
          </div>
        </div>
      </Card>
      {isOpen && <ShowPredicts match={match} isOpen={isOpen} onClose={closeModal} />}
    </>
  );
};

export default MatchCard;
