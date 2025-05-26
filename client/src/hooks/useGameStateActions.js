// client/src/hooks/useGameStateActions.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useGameActions } from './useGameActions';
import * as gameService from '../services/gameService';

export const useGameStateActions = (gameId) => {
  const { accessToken } = useContext(AuthContext);
  const { executeAction, isPending, getError, clearError } = useGameActions();

  const getToken = () => accessToken || localStorage.getItem('accessToken');

  const actions = {
    // Lobby actions
    toggleReady: (userId) => executeAction(
      'toggleReady',
      () => gameService.toggleReady(gameId, userId, getToken()),
      {
        onError: (error) => console.error('Failed to toggle ready status:', error)
      }
    ),

    startGame: (userId, questionData) => executeAction(
      'startGame',
      () => gameService.startGame(gameId, userId, getToken(), questionData),
      {
        onError: (error) => console.error('Failed to start game:', error)
      }
    ),

    // Selection actions
    submitSong: (userId, songData) => executeAction(
      'submitSong',
      () => gameService.submitSong(gameId, userId, songData, getToken()),
      {
        onError: (error) => console.error('Failed to submit song:', error)
      }
    ),

    startEndSelectionCountdown: () => executeAction(
      'startEndSelectionCountdown',
      () => gameService.startEndSelectionCountdown(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to start countdown:', error)
      }
    ),

    // Voting actions
    voteForSong: (userId, submissionId) => executeAction(
      'voteForSong',
      () => gameService.voteForSong(gameId, userId, submissionId, getToken()),
      {
        onError: (error) => console.error('Failed to vote:', error)
      }
    ),

    startEndVotingCountdown: () => executeAction(
      'startEndVotingCountdown',
      () => gameService.startEndVotingCountdown(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to start voting countdown:', error)
      }
    ),

    // Results actions
    startNewRound: (questionData) => executeAction(
      'startNewRound',
      () => gameService.startNewRound(gameId, questionData, getToken()),
      {
        onError: (error) => console.error('Failed to start new round:', error)
      }
    ),

    endGame: () => executeAction(
      'endGame',
      () => gameService.endGame(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to end game:', error)
      }
    ),

    moveToQuestionSelection: () => executeAction(
      'moveToQuestionSelection',
      () => gameService.moveToQuestionSelection(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to move to question selection:', error)
      }
    ),

    // Question selection actions
    setWinnerSelectedQuestion: (questionData) => executeAction(
      'setWinnerSelectedQuestion',
      () => gameService.setWinnerSelectedQuestion(gameId, questionData, getToken()),
      {
        onError: (error) => console.error('Failed to set winner question:', error)
      }
    ),

    hostOverrideQuestion: () => executeAction(
      'hostOverrideQuestion',
      () => gameService.hostOverrideQuestion(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to override question:', error)
      }
    ),

    // General actions
    cancelCountdown: () => executeAction(
      'cancelCountdown',
      () => gameService.cancelCountdown(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to cancel countdown:', error)
      }
    ),

    leaveGame: () => executeAction(
      'leaveGame',
      () => gameService.leaveGame(gameId, getToken()),
      {
        onError: (error) => console.error('Failed to leave game:', error)
      }
    )
  };

  return {
    actions,
    isPending,
    getError,
    clearError
  };
};