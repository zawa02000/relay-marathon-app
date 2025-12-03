import React, { useState, useEffect } from 'react';
import { Play, Flag, Timer, Download, UserPlus, X, ChevronUp, ChevronDown } from 'lucide-react';

// ブラウザのlocalStorageを使った簡易的なストレージ実装
const storage = {
  get: (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: (key, value) => {
    localStorage.setItem(key, value);
    return { key, value };
  }
};

export default function App() {
  const [records, setRecords] = useState([]);
  const [runnerQueue, setRunnerQueue] = useState([]);
  const [newRunner, setNewRunner] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [password, setPassword] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [lapCooldown, setLapCooldown] = useState(0);

  // 初期化
  useEffect(() => {
    loadData();
  }, []);

  // ラップクールダウンタイマー
  useEffect(() => {
    if (lapCooldown > 0) {
      const timer = setTimeout(() => setLapCooldown(lapCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lapCooldown]);

  const loadData = () => {
    try {
      // パスワードの読み込み
      const pwResult = storage.get('relay-password');
      if (pwResult && pwResult.value) {
        setPassword(pwResult.value);
      }

      // 記録の読み込み
      const recordsResult = storage.get('relay-records');
      if (recordsResult && recordsResult.value) {
        setRecords(JSON.parse(recordsResult.value));
      }

      // 走者キューの読み込み
      const queueResult = storage.get('relay-queue');
      if (queueResult && queueResult.value) {
        setRunnerQueue(JSON.parse(queueResult.value));
      }
    } catch (error) {
      console.log('初回起動またはデータなし');
    } finally {
      setLoading(false);
    }
  };

  const saveRecords = (newRecords) => {
    try {
      storage.set('relay-records', JSON.stringify(newRecords));
      setRecords(newRecords);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('データの保存に失敗しました');
    }
  };

  const saveQueue = (newQueue) => {
    try {
      storage.set('relay-queue', JSON.stringify(newQueue));
      setRunnerQueue(newQueue);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('データの保存に失敗しました');
    }
  };

  const handleSetPassword = () => {
    if (!passwordInput.trim()) {
      alert('パスワードを入力してください');
      return;
    }
    try {
      storage.set('relay-password', passwordInput);
      setPassword(passwordInput);
      setIsAuthenticated(true);
      alert('パスワードが設定されました！このパスワードを仲間と共有してください。');
    } catch (error) {
      alert('パスワードの設定に失敗しました');
    }
  };

  const handleLogin = () => {
    if (passwordInput === password) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      alert('パスワードが違います');
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

  const handleAddRunner = () => {
    if (!newRunner.trim()) {
      alert('走者名を入力してください');
      return;
    }
    saveQueue([...runnerQueue, newRunner.trim()]);
    setNewRunner('');
  };

  const handleRemoveRunner = (index) => {
    const newQueue = runnerQueue.filter((_, i) => i !== index);
    saveQueue(newQueue);
  };

  const moveRunnerUp = (index) => {
    if (index === 0) return;
    const newQueue = [...runnerQueue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    saveQueue(newQueue);
  };

  const moveRunnerDown = (index) => {
    if (index === runnerQueue.length - 1) return;
    const newQueue = [...runnerQueue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    saveQueue(newQueue);
  };

  const handleStart = () => {
    if (runnerQueue.length === 0) {
      alert('走者を追加してください');
      return;
    }

    const now = new Date().toISOString();
    const newRecord = {
      lap: 1,
      runner: runnerQueue[0],
      startTime: now,
      endTime: null,
      lapTime: ''
    };

    const newQueue = runnerQueue.slice(1);
    
    saveRecords([newRecord]);
    saveQueue(newQueue);
  };

  const handleLap = () => {
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
    
    saveRecords(updatedRecords);
    saveQueue(newQueue);
    
    setLapCooldown(10);
  };

  const handleGoal = () => {
    if (records.length === 0) {
      alert('記録がありません');
      return;
    }

    const now = new Date().toISOString();
    const updatedRecords = [...records];
    const lastRecord = updatedRecords[updatedRecords.length - 1];

    lastRecord.endTime = now;
    lastRecord.lapTime = calculateLapTime(lastRecord.startTime, now);

    saveRecords(updatedRecords);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedRecords = records.filter((_, i) => i !== deleteIndex);
      saveRecords(updatedRecords);
      setDeleteIndex(null);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    saveRecords([]);
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
    link.setAttribute('download', `リレーマラソン記録_${new Date().toLocaleDateString('ja-JP')}.csv`);
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

  // メイン画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8 mt-4">
          🏃 記録用アプリ
        </h1>

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
                disabled={records.length > 0 || runnerQueue.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Play size={20} />
                スタート
              </button>
              
              <button
                onClick={handleLap}
                disabled={records.length === 0 || runnerQueue.length === 0 || (records[records.length - 1]?.endTime !== null) || lapCooldown > 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Timer size={20} />
                {lapCooldown > 0 ? `ラップ (${lapCooldown}秒)` : 'ラップ'}
              </button>
              
              <button
                onClick={handleGoal}
                disabled={records.length === 0 || (records[records.length - 1]?.endTime !== null)}
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
            <strong>💡 使い方:</strong> このアプリのURLとパスワードを仲間と共有すれば、みんなで同時に記録できます！
          </p>
        </div>
      </div>
    </div>
  );
}