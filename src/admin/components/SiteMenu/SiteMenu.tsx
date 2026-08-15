import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { AdminLinks } from '../../routes/Routes';
import { NavLink } from 'react-router-dom';
import styles from './styles.module.scss';

const SiteMenu = () => (
  <List component="nav">
    <ListItem disablePadding>
      <ListItemButton className={styles.link} component={NavLink} to={AdminLinks.Home} end>
        <ListItemText primary="Головна" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Tournaments}>
        <ListItemText primary="Турніри" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Teams}>
        <ListItemText primary="Команди" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Matches}>
        <ListItemText primary="Матчі" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Rooms}>
        <ListItemText primary="Кімнати" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Predictions}>
        <ListItemText primary="Прогнози" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton component={NavLink} to={AdminLinks.Users}>
        <ListItemText primary="Користувачі" />
      </ListItemButton>
    </ListItem>
  </List>
);

export default SiteMenu;
