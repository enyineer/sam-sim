import { Navbar, Center, Tooltip, UnstyledButton, createStyles, Stack } from '@mantine/core';
import {
  Icon,
  IconHome2,
  IconLogout,
  IconFireHydrant,
  IconLogin,
} from '@tabler/icons-react';
import logo from '../assets/sam-logo.svg';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, useSigninCheck } from 'reactfire';

const useStyles = createStyles((theme) => ({
  link: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
    },
  },

  active: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
    },
  },
}));

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  const { classes, cx } = useStyles();

  return (
    <Tooltip label={label} position="right" transitionDuration={0}>
      <UnstyledButton onClick={onClick} className={cx(classes.link, { [classes.active]: active })}>
        <Icon stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const linkList = [
  { icon: IconHome2, label: 'Startseite', route: '/' },
  { icon: IconFireHydrant, label: 'Wachen', route: '/stations' },
];

export function NavbarMinimal() {
  const location = useLocation();
  const { status: signInCheckStatus, data: signInCheckResult } = useSigninCheck();
  const auth = useAuth();

  if (signInCheckStatus !== 'success') {
    return <>Loading...</>;
  }

  const links = linkList.map((link) => (
    <NavLink
      to={link.route}
      key={link.label}
    >
      <NavbarLink
        {...link}
        active={location.pathname === link.route}
      />
    </NavLink>
  ));

  const logout = async () => {
    await auth.signOut();

    // https://github.com/FirebaseExtended/reactfire/discussions/228#discussioncomment-2101193
    const reactFirePreloadedObservables = (globalThis as Record<string, unknown>)['_reactFirePreloadedObservables'] as
      | Map<string, unknown>
      | undefined;
    if (reactFirePreloadedObservables) {
      Array.from(reactFirePreloadedObservables.keys())
        .filter((key) => key.includes('firestore'))
        .forEach((key) =>
          reactFirePreloadedObservables.delete(key)
        );
    }
  }

  return (
    <Navbar width={{ base: 80 }} p="md" zIndex={0}>
      <Center>
        <img src={logo} width={20}/>
      </Center>
      <Navbar.Section grow mt={20}>
        <Stack justify="center" spacing={5}>
          {links}
        </Stack>
      </Navbar.Section>
      <Navbar.Section>
        <Stack justify="center" spacing={0}>
          {
            signInCheckResult.signedIn &&
            <NavbarLink icon={IconLogout} label="Logout" onClick={() => logout()} />
          }
          {
            !signInCheckResult.signedIn &&
            <NavLink
              to={`/auth/login?from=${encodeURIComponent(location.pathname)}`}
            >
              <NavbarLink icon={IconLogin} label="Login" />
            </NavLink>
          }
        </Stack>
      </Navbar.Section>
    </Navbar>
  );
}