import React, { useState, useEffect } from 'react';
import { Play, Flag, Timer, Download, UserPlus, X, ChevronUp, ChevronDown, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, remove } from 'firebase/database';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBN1vI5spCjUogzhwkOJIyChAAYQH6u6Cc",
  authDomain: "relay-marathon-app-1da47.firebaseapp.com",
  databaseURL: "https://relay-marathon-app-1da47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "relay-marathon-app-1da47",
  storageBucket: "relay-marathon-app-1da47.firebasestorage.app",
  messagingSenderId: "238551878474",
  appId: "1:238551878474:web:23d174de23749980f20fb3"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'raceList', 'main'
  const [currentRaceId, setCurrentRaceId] = useState(null);
  const [currentRaceName, setCurrentRaceName] = useState('');
  const [races, setRaces] = useState({});
  const [newRaceName, setNewRaceName] = useState('');
  
  const [records, setRecords] = useState([]);
  const [runnerQueue, setRunnerQueue] = useState([]);
  const [newRunner, setNewRunner] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [password, setPassword] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteRaceId, setDeleteRaceId] = useState(null);
  const [lapCooldown, setLapCooldown] = useState(0);

  // パスワードの監視
  useEffect(() => {
    const passwordRef = ref(database, 'password');
    const unsubscribe = onValue(passwordRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPassword(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // レース一覧の監視
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const racesRef = ref(database, 'races');
    const unsubscribe = onValue(racesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRaces(data);
      } else {
        setRaces({});
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // 選択されたレースの記録とキューの監視
  useEffect(() => {
    if (!currentRaceId) return;

    const recordsRef = ref(database, `races/${currentRaceId}/records`);
    const unsubscribeRecords = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        setRecords(data);
      } else if (data && typeof data === 'object') {
        const recordsArray = Object.values(data);
        setRecords(recordsArray);
      } else {
        setRecords([]);
      }
    });

    const queueRef = ref(database, `races/${currentRaceId}/runnerQueue`);
    const unsubscribeQueue = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        setRunnerQueue(data);
      } else if (data && typeof data === 'object') {
        const queueArray = Object.values(data);
        setRunnerQueue(queueArray);
      } else {
        setRunnerQueue([]);
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeQueue();
    };
  }, [currentRaceId]);

  // ラップクールダウンタイマー
  useEffect(() => {
    if (lapCooldown > 0) {
      const timer = setTimeout(() => setLapCooldown(lapCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lapCooldown]);

  const saveRecords = async (newRecords) => {
    try {
      await set(ref(database, `races/${currentRaceId}/records`), newRecords);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('データの保存に失敗しました');
    }
  };

  const saveQueue = async (newQueue) => {
    try {
      await set(ref(database, `races/${currentRaceId}/runnerQueue`), newQueue);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('データの保存に失敗しました');
    }
  };

  const handleSetPassword = async () => {
    if (!passwordInput.trim()) {
      alert('パスワードを入力してください');
      return;
    }
    try {
      await set(ref(database, 'password'), passwordInput);
      setIsAuthenticated(true);
      setCurrentView('raceList');
      alert('パスワードが設定されました！このパスワードを仲間と共有してください。');
    } catch (error) {
      alert('パスワードの設定に失敗しました');
    }
  };

  const handleLogin = () => {
    if (passwordInput === password) {
      setIsAuthenticated(true);
      setCurrentView('raceList');
      setPasswordInput('');
    } else {
      alert('パスワードが違います');
    }
  };

  const handleCreateRace = async () => {
    if (!newRaceName.trim()) {
      alert('レース名を入力してください');
      return;
    }
    
    const raceId = Date.now().toString();
    try {
      await set(ref(database, `races/${raceId}`), {
        name: newRaceName,
        createdAt: new Date().toISOString(),
        records: [],
        runnerQueue: []
      });
      setNewRaceName('');
      alert('レースを作成しました');
    } catch (error) {
      alert('レースの作成に失敗しました');
    }
  };

  const handleSelectRace = (raceId, raceName) => {
    setCurrentRaceId(raceId);
    setCurrentRaceName(raceName);
    setCurrentView('main');
  };

  const handleBackToList = () => {
    setCurrentRaceId(null);
    setCurrentRaceName('');
    setRecords([]);
    setRunnerQueue([]);
    setCurrentView('raceList');
  };

  const handleDeleteRace = (raceId) => {
    setDeleteRaceId(raceId);
  };

  const confirmDeleteRace = async () => {
    if (deleteRaceId) {
      try {
        await remove(ref(database, `races/${deleteRaceId}`));
        setDeleteRaceId(null);
        alert('レースを削除しました');
      } catch (error) {
        alert('レースの削除に失敗しました');
      }
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const calculateLapTime = (start, end) => {
    if (!start || !end) return '';
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddRunner = async () => {
    if (!newRunner.trim()) {
      alert('走者名を入力してください');
      return;
    }
    await saveQueue([...runnerQueue, newRunner.trim()]);
    setNewRunner('');
  };

  const handleRemoveRunner = async (index) => {
    const newQueue = runnerQueue.filter((_, i) => i !== index);
    await saveQueue(newQueue);
  };

  const moveRunnerUp = async (index) => {
    if (index === 0) return;
    const newQueue = [...runnerQueue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    await saveQueue(newQueue);
  };

  const moveRunnerDown = async (index) => {
    if (index === runnerQueue.length - 1) return;
    const newQueue = [...runnerQueue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    await saveQueue(newQueue);
  };

  const handleStart = async () => {
    if (runnerQueue.length === 0) {
      alert('走者を追加してください');
      return;
    }

    const now = new Date().toISOString();
    const nextLap = records.length > 0 ? records[records.length - 1].lap + 1 : 1;
    
    const newRecord = {
      lap: nextLap,
      runner: runnerQueue[0],
      startTime: now,
      endTime: null,
      lapTime: ''
    };

    const newQueue = runnerQueue.slice(1);
    
    await saveRecords([...records, newRecord]);
    await saveQueue(newQueue);
  };

  const handleLap = async () => {
    if (lapCooldown > 0) {
      alert(`あと${lapCooldown}秒待ってください`);
      return;
    }

    if (runnerQueue.length === 0) {
      alert('次の走者を追加してください');
      return;
    }

    if (records.length === 0) {
      alert('まず「スタート」ボタンを押してください');
      return;
    }

    const now = new Date().toISOString();
    const updatedRecords = [...records];
    const lastRecord = updatedRecords[updatedRecords.length - 1];

    lastRecord.endTime = now;
    lastRecord.lapTime = calculateLapTime(lastRecord.startTime, now);

    const newRecord = {
      lap: lastRecord.lap + 1,
      runner: runnerQueue[0],
      startTime: now,
      endTime: null,
      lapTime: ''
    };

    updatedRecords.push(newRecord);
    const newQueue = runnerQueue.slice(1);
    
    await saveRecords(updatedRecords);
    await saveQueue(newQueue);
    
    setLapCooldown(10);
  };

  const handleGoal = async () => {
    if (records.length === 0) {
      alert('記録がありません');
      return;
    }

    const now = new Date().toISOString();
    const updatedRecords = [...records];
    const lastRecord = updatedRecords[updatedRecords.length - 1];

    lastRecord.endTime = now;
    lastRecord.lapTime = calculateLapTime(lastRecord.startTime, now);

    await saveRecords(updatedRecords);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
  };

  const confirmDelete = async () => {
    if (deleteIndex !== null) {
      const updatedRecords = records.filter((_, i) => i !== deleteIndex);
      await saveRecords(updatedRecords);
      setDeleteIndex(null);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    await saveRecords([]);
    setShowResetConfirm(false);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('エクスポートする記録がありません');
      return;
    }

    const headers = ['周回,走者名,スタート時刻,ゴール時刻,ラップタイム'];
    const rows = records.map(r => 
      `${r.lap},${r.runner},${formatTime(r.startTime)},${formatTime(r.endTime)},${r.lapTime}`
    );
    const csv = headers.concat(rows).join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentRaceName}_${new Date().toLocaleDateString('ja-JP')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>;
  }

  // パスワード未設定の場合
  if (!password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-indigo-900 mb-6">
            🔐 パスワード設定
          </h1>
          <p className="text-gray-600 mb-4">
            初回起動です。アプリ用のパスワードを設定してください。このパスワードを仲間と共有することで、みんなでアクセスできるようになります。
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="パスワードを入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSetPassword()}
          />
          <button
            onClick={handleSetPassword}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            パスワードを設定
          </button>
        </div>
      </div>
    );
  }

  // ログイン画面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-indigo-900 mb-6">
            🏃 記録用アプリ
          </h1>
          <p className="text-gray-600 mb-4 text-center">
            パスワードを入力してください
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  // レース一覧画面
  if (currentView === 'raceList') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8 mt-4">
            🏃 レース一覧
          </h1>

          {/* レース削除確認モーダル */}
          {deleteRaceId !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-bold mb-4">確認</h3>
                <p className="mb-6">このレースを削除しますか？</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDeleteRaceId(null)}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={confirmDeleteRace}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 新規レース作成 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">新規レース作成</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRaceName}
                onChange={(e) => setNewRaceName(e.target.value)}
                placeholder="レース名を入力"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRace()}
              />
              <button
                onClick={handleCreateRace}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                <Plus size={20} />
                作成
              </button>
            </div>
          </div>

          {/* レース一覧 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">レース選択</h2>
            {Object.keys(races).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                レースがありません。上記から新規作成してください。
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(races).map(([raceId, race]) => (
                  <div
                    key={raceId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <button
                      onClick={() => handleSelectRace(raceId, race.name)}
                      className="flex-1 text-left font-medium text-indigo-900"
                    >
                      {race.name}
                    </button>
                    <button
                      onClick={() => handleDeleteRace(raceId)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="削除"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // メイン画面（記録画面）
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 mt-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
          >
            <ArrowLeft size={20} />
            レース一覧に戻る
          </button>
          <h1 className="text-4xl font-bold text-center text-indigo-900 flex-1">
            🏃 {currentRaceName}
          </h1>
          <div className="w-40"></div>
        </div>

        {/* リセット確認モーダル */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold mb-4">確認</h3>
              <p className="mb-6">全ての記録をリセットしますか？</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 削除確認モーダル */}
        {deleteIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold mb-4">確認</h3>
              <p className="mb-6">この記録を削除しますか？</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteIndex(null)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 走者登録セクション */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">走者登録</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRunner}
              onChange={(e) => setNewRunner(e.target.value)}
              placeholder="走者名を入力"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRunner()}
            />
            <button
              onClick={handleAddRunner}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
            >
              <UserPlus size={20} />
              追加
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {runnerQueue.length === 0 ? (
              <p className="text-gray-500 text-sm">走者を追加してください</p>
            ) : (
              runnerQueue.map((runner, index) => (
                <div key={index} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                  <span className="font-medium">{index + 1}. {runner}</span>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => moveRunnerUp(index)}
                      disabled={index === 0}
                      className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="上に移動"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveRunnerDown(index)}
                      disabled={index === runnerQueue.length - 1}
                      className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="下に移動"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveRunner(index)}
                      className="text-red-600 hover:text-red-800"
                      title="削除"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* コントロールパネル */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={handleStart}
                disabled={
                  runnerQueue.length === 0 ||
                  (records.length > 0 && records[records.length - 1] && !records[records.length - 1].endTime)
                }
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Play size={20} />
                {records.length > 0 && records[records.length - 1]?.endTime ? '再スタート' : 'スタート'}
              </button>
              
              <button
                onClick={handleLap}
                disabled={
                  records.length === 0 || 
                  runnerQueue.length === 0 || 
                  (records.length > 0 && records[records.length - 1] && records[records.length - 1].endTime !== null && records[records.length - 1].endTime !== undefined) || 
                  lapCooldown > 0
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Timer size={20} />
                {lapCooldown > 0 ? `ラップ (${lapCooldown}秒)` : 'ラップ'}
              </button>
              
              <button
                onClick={handleGoal}
                disabled={
                  records.length === 0 || 
                  (records.length > 0 && records[records.length - 1] && records[records.length - 1].endTime !== null && records[records.length - 1].endTime !== undefined)
                }
                className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Flag size={20} />
                ゴール
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={records.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Download size={20} />
                CSV出力
              </button>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                リセット
              </button>
            </div>
          </div>
        </div>

        {/* 記録テーブル */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">周回</th>
                  <th className="px-4 py-3 text-left">走者名</th>
                  <th className="px-4 py-3 text-left">スタート時刻</th>
                  <th className="px-4 py-3 text-left">ゴール時刻</th>
                  <th className="px-4 py-3 text-left">ラップタイム</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      記録がありません。走者を登録して「スタート」ボタンを押してください。
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-semibold">{record.lap}</td>
                      <td className="px-4 py-3">{record.runner}</td>
                      <td className="px-4 py-3">{formatTime(record.startTime)}</td>
                      <td className="px-4 py-3">{formatTime(record.endTime)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                        {record.lapTime}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 説明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 使い方:</strong> みんなで同時に記録できます！データはリアルタイムで同期されます。名前を入力して追加ボタンを押すとランナー予約されます。
          </p>
        </div>
      </div>
    </div>
  );
}