import Skeleton from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import { Card } from 'components';
import { useAppSelector } from 'store';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  const { isLoading } = useAppSelector((state) => state.tournament.getTournamentsRequest);
  const { tournaments } = useAppSelector((state) => state.tournament);

  return (
    <div className={styles.home}>
      <div className={styles.homeRow}>
        {isLoading ? (
          <>
            <Card className={styles.homeCol}>
              <div className={styles.homeTournament}>
                <Skeleton />
                <Skeleton height={100} />
              </div>
            </Card>
            <Card className={styles.homeCol}>
              <div className={styles.homeTournament}>
                <Skeleton />
                <Skeleton height={100} />
              </div>
            </Card>
          </>
        ) : (
          tournaments.map((tournament) => (
            <Card title={tournament.name} className={styles.homeCol} key={tournament.id}>
              <div className={styles.homeTournament}>
                <Link to={`/tournament/${tournament.id}`}>
                  <img src={`${process.env.REACT_APP_UPLOAD_URL}/${tournament.logo}`} alt={tournament.name} />
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
