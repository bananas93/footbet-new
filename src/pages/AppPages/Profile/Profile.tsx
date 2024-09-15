import { Card } from 'components';
import styles from './Profile.module.scss';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getProfile } from 'store/slices/profile';
import { useEffect } from 'react';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useAppSelector((state) => state.profile.getProfileRequest);
  const { userId, tournamentId } = useParams<{ userId: string; tournamentId: string }>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await dispatch(getProfile({ userId: Number(userId), tournamentId: Number(tournamentId) })).unwrap();
      } catch (err: any) {
        console.error(err.message);
      }
    };

    fetchUser();
  }, [dispatch, tournamentId, userId]);

  if (isLoading) {
    return <div>Завантаження...</div>;
  }

  if (!userId) {
    return <div>Помилка</div>;
  }

  if (!data) {
    return <div>Дані не знайдено</div>;
  }

  return (
    <div className={styles.container}>
      <Card title={`Деталі профілю ${data?.user?.name}`}>
        <div>
          <div>
            <div>Матчів</div>
            <div>{data.statistics.total}</div>
          </div>
          <div>
            <div>Загальна кількість очок</div>
            <div>{data?.statistics?.totalPoints}</div>
          </div>
          <div>
            <div>Вгадано точних результатів</div>
            <div>{data?.statistics.correctScore}</div>
          </div>
          <div>
            <div>Вгадано результатів</div>
            <div>{data?.statistics.correctResult}</div>
          </div>
          <div>
            <div>Вгадано різниць</div>
            <div>{data?.statistics.correctDifference}</div>
          </div>
        </div>
        <div>
          <div>
            <div>Загальна кількість очок</div>
            <div>{data?.statistics.correctHomePredictions}</div>
          </div>
          <div>
            <div>Загальна кількість очок</div>
            <div>{data?.statistics.correctAwayPredictions}</div>
          </div>

          <div>
            <div>Вгадано результатів</div>
            <div>
              {data.statistics.total - data.statistics.correctHomePredictions - data.statistics.correctAwayPredictions}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
