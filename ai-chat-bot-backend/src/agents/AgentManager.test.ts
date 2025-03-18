import { AgentManager } from './AgentManager';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  it('should be defined', () => {
    expect(agentManager).toBeDefined();
  });

  it('should have setContext method', () => {
    expect(agentManager.setContext).toBeDefined();
  });
});