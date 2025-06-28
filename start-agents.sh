#!/bin/bash

# Start Claude Code in all multiagent panes
echo "🚀 Starting agents in multiagent session..."

# Get tmux indices dynamically
get_pane_base_index() {
    local session="$1"
    local pane_index=$(tmux show-options -t "$session" -g pane-base-index 2>/dev/null | awk '{print $2}')
    echo ${pane_index:-0}
}

# Get the base pane index for multiagent session
pane_base=$(get_pane_base_index multiagent)

# Start Claude Code in each pane
for i in {0..3}; do
    pane_num=$((pane_base + i))
    agent_name=""
    case $i in
        0) agent_name="boss1" ;;
        1) agent_name="worker1" ;;
        2) agent_name="worker2" ;;
        3) agent_name="worker3" ;;
    esac
    
    echo "Starting $agent_name in pane $pane_num..."
    tmux send-keys -t multiagent:agents.$pane_num 'claude --dangerously-skip-permissions' C-m
done

echo "✅ All agents started!"