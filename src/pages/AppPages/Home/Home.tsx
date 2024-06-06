import { Link } from 'react-router-dom';
import { useAppSelector } from 'store';

const Home: React.FC = () => {
  const { tournaments } = useAppSelector((state) => state.tournament);
  const { rooms } = useAppSelector((state) => state.room);
  return (
    <div>
      <h1>Home</h1>
      {tournaments.map((tournament) => (
        <Link to={`/tournament/${tournament.id}`} key={tournament.id}>
          <img src={`http://localhost:3000/uploads/${tournament.logo}`} alt={tournament.name} />
          {tournament.name}
        </Link>
      ))}
      {rooms.map((room) => (
        <div key={room.id}>{room.name}</div>
      ))}
    </div>
  );
};

export default Home;
