import { Flex, Title } from '@mantine/core';
import logo from '../assets/sam-logo.svg';

export default function IndexPage() {
  return (
    <Flex direction="column" h="100%" align="center" justify="center">
      <img src={logo} width="30%" height="30%" />
      <Title mt="md">SAM Simulator</Title>
    </Flex>
  )
}