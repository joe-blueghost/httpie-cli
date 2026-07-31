import os
import tempfile

import pytest

from httpie.status import ExitStatus
from .utils import http, MockEnvironment, HTTP_OK


class TestSaveFlag:

    def test_save_basic(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r = http('--save', '--save-dir', tmp_dir, httpbin + '/get')
            assert HTTP_OK in r
            assert 'Saving to:' in r.stderr
            files = os.listdir(tmp_dir)
            assert len(files) == 1
            assert files[0] == 'get.json'

    def test_save_filename_from_url_with_extension(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r = http('--save', '--save-dir', tmp_dir, httpbin + '/robots.txt')
            assert HTTP_OK in r
            assert 'Saving to:' in r.stderr
            files = os.listdir(tmp_dir)
            assert len(files) == 1
            assert files[0] == 'robots.txt'

    def test_save_custom_directory(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            sub_dir = os.path.join(tmp_dir, 'subdir')
            os.makedirs(sub_dir)
            r = http('--save', '--save-dir', sub_dir, httpbin + '/get')
            assert HTTP_OK in r
            files = os.listdir(sub_dir)
            assert len(files) == 1

    def test_save_content_disposition(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r = http(
                '--save', '--save-dir', tmp_dir,
                httpbin + '/response-headers?Content-Disposition=attachment%3B%20filename%3Dmyfile.json',
            )
            assert 'Saving to:' in r.stderr
            files = os.listdir(tmp_dir)
            assert len(files) == 1
            assert files[0] == 'myfile.json'

    def test_save_unique_filename(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r1 = http('--save', '--save-dir', tmp_dir, httpbin + '/get')
            assert HTTP_OK in r1
            r2 = http('--save', '--save-dir', tmp_dir, httpbin + '/get')
            assert HTTP_OK in r2
            files = sorted(os.listdir(tmp_dir))
            assert len(files) == 2
            assert 'get' in files[0]

    def test_save_normal_output_unaffected(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r_save = http('--save', '--save-dir', tmp_dir, httpbin + '/get')
            r_normal = http(httpbin + '/get')
            assert HTTP_OK in r_save
            assert HTTP_OK in r_normal

    def test_save_with_print_flag(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r = http('--save', '--save-dir', tmp_dir, '--print=b', httpbin + '/get')
            assert 'Saving to:' in r.stderr
            files = os.listdir(tmp_dir)
            assert len(files) == 1


class TestSaveFlagErrors:

    def test_save_mutually_exclusive_with_download(self, httpbin):
        r = http(
            '--save', '--download',
            httpbin + '/get',
            tolerate_error_exit_status=True,
        )
        assert r.exit_status == ExitStatus.ERROR
        assert '--save and --download are mutually exclusive' in r.stderr

    def test_save_mutually_exclusive_with_output(self, httpbin):
        r = http(
            '--save', '--output', os.devnull,
            httpbin + '/get',
            tolerate_error_exit_status=True,
        )
        assert r.exit_status == ExitStatus.ERROR
        assert '--save and --output are mutually exclusive' in r.stderr

    def test_save_dir_without_save(self, httpbin):
        with tempfile.TemporaryDirectory() as tmp_dir:
            r = http(
                '--save-dir', tmp_dir,
                httpbin + '/get',
                tolerate_error_exit_status=True,
            )
            assert r.exit_status == ExitStatus.ERROR
            assert '--save-dir requires --save' in r.stderr
