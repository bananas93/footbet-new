/* eslint-disable react-hooks/exhaustive-deps */
import { useAppDispatch, useAppSelector } from 'store';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useTournament } from '../../Tournament';
import MatchCard from './MatchCard/MatchCard';
import { normalizeKnockoutRoundName, sliceMatches } from 'helpers';
import styles from './Matches.module.scss';
import { Card, Switcher } from 'components';
import { useEffect, useState } from 'react';
import { toggleOnlyLiveMatches } from 'store/slices/user';

const Matches: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();

  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const { onlyLiveMatches } = useAppSelector((state) => state.user);
  const toggleLiveMatches = () => {
    dispatch(toggleOnlyLiveMatches());
  };

  const matches = useAppSelector((state) => state.match.matches)[tournament.id] || [];
  const { groupMatchNumber, knockoutRound, thirdPlaceMatch } = tournament;
  const knockoutRounds = normalizeKnockoutRoundName(knockoutRound, thirdPlaceMatch);

  const { groupMatches, knockoutMatches } = sliceMatches(matches, groupMatchNumber);

  useEffect(() => {
    setTimeout(() => {
      if (matches.length > 0) {
        const today = new Date().setHours(0, 0, 0, 0);
        const activeIndex = matches.findIndex((match, index) => {
          const matchStartDate = new Date(match.startDate).setHours(0, 0, 0, 0);
          const nextMatchStartDate =
            index < matches.length - 1
              ? new Date(matches[index + 1].startDate).setHours(0, 0, 0, 0)
              : new Date(match.endDate).setHours(0, 0, 0, 0);

          return today >= matchStartDate && today < nextMatchStartDate;
        });

        setActiveTab(activeIndex !== -1 ? activeIndex : 0);
      }
    }, 0);
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
            <Switcher label="Live" value={onlyLiveMatches} onChange={toggleLiveMatches} className={styles.switcher} />
            <div className={styles.matches}>
              {groupMatches[i]?.data
                .filter((match) => (onlyLiveMatches ? match.status === 'Live' : match))
                .map((match) => (
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
              <Switcher label="Live" value={onlyLiveMatches} onChange={toggleLiveMatches} className={styles.switcher} />
              <div className={styles.matches}>
                {knockoutMatches[i]?.data
                  .filter((match) => (onlyLiveMatches ? match.status === 'Live' : match))
                  .map((match) => (
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
