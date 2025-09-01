import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import {
  Search,
  Visibility,
  People,
  TrendingUp,
  AccountTree,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';


const ReferralReport = () => {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNetwork, setUserNetwork] = useState(null);
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`/referral/networks?page=${currentPage}&search=${searchTerm}`),
        axios.get('/referral/statistics'),
      ]);

      setUsers(usersRes.data.users);
      setTotalPages(usersRes.data.pagination.total);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReferralData();
  };

  const handleViewNetwork = async (user) => {
    setSelectedUser(user);
    setNetworkDialogOpen(true);
    setNetworkLoading(true);

    try {
      const response = await axios.get(`/referral/user/${user._id}`);
      setUserNetwork(response.data);
    } catch (error) {
      console.error('Error fetching user network:', error);
    } finally {
      setNetworkLoading(false);
    }
  };

  const renderNetworkTree = (networkData) => {
    if (!networkData) return null;

    const renderTreeItem = (user, level = 0) => (
      <Box key={user.id || user._id} sx={{ ml: level * 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 1, 
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          mb: 1,
          backgroundColor: '#fafafa'
        }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {user.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.balance.coins} coins
            </Typography>
          </Box>
        </Box>
        {user.children && user.children.map(child => renderTreeItem(child, level + 1))}
      </Box>
    );

    return (
      <Box>
        {renderTreeItem(networkData.tree)}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Referral Report
      </Typography>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Referrals
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {statistics.monthlyStats.totalReferrals.toLocaleString()}
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 32, color: '#1976d2' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      New This Month
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {statistics.monthlyStats.newReferrals.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 32, color: '#2e7d32' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Top Referrer
                    </Typography>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                      {statistics.topReferrers[0]?.username || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statistics.topReferrers[0]?.referralCount || 0} referrals
                    </Typography>
                  </Box>
                  <AccountTree sx={{ fontSize: 32, color: '#ed6c02' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Avg Referrals
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {statistics.topReferrers.length > 0 
                        ? (statistics.topReferrers.reduce((sum, user) => sum + user.referralCount, 0) / statistics.topReferrers.length).toFixed(1)
                        : 0
                      }
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 32, color: '#9c27b0' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, name, or email..."
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={handleSearch}
                      variant="contained"
                      startIcon={<Search />}
                      sx={{ ml: 1 }}
                    >
                      Search
                    </Button>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Button
                onClick={fetchReferralData}
                startIcon={<Refresh />}
                variant="outlined"
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Referral Networks
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Referral Code</TableCell>
                  <TableCell>Referred By</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.referralCode} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {user.referredBy ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                            {user.referredBy.username.charAt(0).toUpperCase()}
                          </Avatar>
                          {user.referredBy.username}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Direct
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`Level ${user.referralLevel}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {user.balance.coins.toLocaleString()} coins
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${user.balance.usd.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Network">
                        <IconButton
                          onClick={() => handleViewNetwork(user)}
                          size="small"
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Network Dialog */}
      <Dialog
        open={networkDialogOpen}
        onClose={() => setNetworkDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Referral Network: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          {networkLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : userNetwork ? (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Network Statistics
                      </Typography>
                      <Typography variant="body2">
                        Total Referrals: {userNetwork.statistics.totalReferrals}
                      </Typography>
                      <Typography variant="body2">
                        Network Levels: {userNetwork.statistics.networkLevels}
                      </Typography>
                      <Typography variant="body2">
                        Total Earnings: {userNetwork.statistics.totalReferralEarnings.toFixed(2)} coins
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Info
                      </Typography>
                      <Typography variant="body2">
                        Username: {userNetwork.user.username}
                      </Typography>
                      <Typography variant="body2">
                        Email: {userNetwork.user.email}
                      </Typography>
                      <Typography variant="body2">
                        Referral Code: {userNetwork.user.referralCode}
                      </Typography>
                      <Typography variant="body2">
                        Level: {userNetwork.user.referralLevel}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Network Tree
                  </Typography>
                  {renderNetworkTree(userNetwork)}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Typography>No network data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNetworkDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReferralReport;
