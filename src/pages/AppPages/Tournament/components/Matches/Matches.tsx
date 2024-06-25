/* eslint-disable react-hooks/exhaustive-deps */
import { useAppSelector } from 'store';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useTournament } from '../../Tournament';
import MatchCard from './MatchCard/MatchCard';
import { normalizeKnockoutRoundName, sliceMatches } from 'helpers';
import styles from './Matches.module.scss';
import { Card } from 'components';
import { useEffect, useState } from 'react';

const Matches: React.FC = () => {
  const { tournament } = useTournament();

  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const matches = useAppSelector((state) => state.match.matches)[tournament.id] || [];
  const { groupMatchNumber, knockoutRound, thirdPlaceMatch } = tournament;
  const knockoutRounds = normalizeKnockoutRoundName(knockoutRound, thirdPlaceMatch);

  const { groupMatches, knockoutMatches } = sliceMatches(matches, groupMatchNumber);

  useEffect(() => {
    if (matches.length > 0) {
      const currentDate = new Date();
      matches.forEach((group, index) => {
        const { startDate, endDate } = group;
        if (
          new Date(startDate).getTime() <= currentDate.getTime() &&
          currentDate.getTime() <= new Date(endDate).getTime()
        ) {
          setActiveTab(index);
        }
      });
    }
  }, []);

  if (matches.length === 0) {
    return (
      <div className={styles.container}>
        <Card>
          <div className={styles.empty}>No matches</div>
        </Card>
      </div>
    );
  }

  return (
    <Tabs className="tabs" selectedIndex={activeTab} onSelect={handleTabChange}>
      <TabList className="tabs__list">
        {Array.from({ length: groupMatches.length }, (_, i) => (
          <Tab className="tabs__name" key={i + 1}>
            Тур {i + 1}
          </Tab>
        ))}
        {knockoutMatches.length > 0 &&
          Array.from({ length: knockoutRounds.length }, (_, i) => (
            <Tab className="tabs__name" key={groupMatches.length + i + 1}>
              {knockoutRounds[i]}
            </Tab>
          ))}
      </TabList>
      {Array.from({ length: groupMatches.length }, (_, i) => (
        <TabPanel className="tabs__panel" key={i + 1}>
          <div className={styles.container}>
            <div className={styles.matches}>
              {groupMatches[i]?.data.map((match) => (
                <MatchCard key={match.id} match={match} tournament={tournament} />
              ))}
            </div>
          </div>
        </TabPanel>
      ))}
      {knockoutMatches.length > 0 &&
        Array.from({ length: knockoutRounds.length }, (_, i) => (
          <TabPanel className="tabs__panel" key={groupMatches.length + i + 1}>
            <div className={styles.container}>
              <div className={styles.matches}>
                {knockoutMatches[i]?.data.map((match) => (
                  <MatchCard key={match.id} match={match} tournament={tournament} />
                ))}
              </div>
            </div>
          </TabPanel>
        ))}
    </Tabs>
  );
};

export default Matches;
